#!/usr/bin/env bash
# One-time (but idempotent) bootstrap for a fresh seyfarth-db volume:
#   1. sets passwords on internal Supabase roles (the postgres image creates
#      them without a password, so auth/rest/storage can't connect otherwise)
#   2. fixes auth.uid()/role()/email() ownership so gotrue can start
#   3. grants supabase_storage_admin the roles it needs to set RLS context
#   4. applies our own migrations, skipping if already applied
#
# See the supabase-self-hosted-docker skill for why each step is needed.
# Usage (from repo root, on the server): bash supabase/db/bootstrap.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
CONTAINER="seyfarth-db"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found!"
  exit 1
fi

PW=$(grep '^SUPABASE_DB_PASSWORD=' "$ENV_FILE" | cut -d= -f2-)
if [ -z "$PW" ]; then
  echo "ERROR: SUPABASE_DB_PASSWORD missing in $ENV_FILE!"
  exit 1
fi

echo "Waiting for $CONTAINER to accept connections..."
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 2; done

echo "Fixing internal role passwords (idempotent)..."
docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -v pw="$PW" <<-'EOSQL'
  ALTER USER authenticator          WITH PASSWORD :'pw';
  ALTER USER supabase_auth_admin    WITH PASSWORD :'pw';
  ALTER USER supabase_storage_admin WITH PASSWORD :'pw';
  ALTER USER supabase_admin         WITH PASSWORD :'pw';
EOSQL

echo "Fixing auth function ownership (idempotent)..."
# postgres is superuser but Postgres still requires membership in the target
# role for ALTER ... OWNER TO — grant it to itself first (idempotent).
docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 <<-'EOSQL'
  GRANT supabase_auth_admin TO postgres;
  ALTER FUNCTION auth.uid()   OWNER TO supabase_auth_admin;
  ALTER FUNCTION auth.role()  OWNER TO supabase_auth_admin;
  ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;
EOSQL

echo "Granting storage-admin role memberships (idempotent)..."
# supabase_storage_admin is a "reserved" role — only the real superuser
# (supabase_admin, NOT postgres — postgres only has CREATEROLE here) can
# grant role memberships to it. supabase_admin needs -d postgres explicitly
# since no database named after it exists, and its password auth (no local
# trust rule for it) is read from the container's own env, never printed.
docker exec -i "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1' <<-'EOSQL'
  GRANT service_role  TO supabase_storage_admin;
  GRANT authenticated TO supabase_storage_admin;
  GRANT anon          TO supabase_storage_admin;
EOSQL

echo "Applying app migrations (skips if already applied)..."
EXISTING=$(docker exec "$CONTAINER" psql -U postgres -tAc "select to_regclass('public.customer_profiles')")
if [ -z "$EXISTING" ] || [ "$EXISTING" = "" ]; then
  for f in "$REPO_ROOT"/supabase/migrations/*.sql; do
    echo "  -> $(basename "$f")"
    docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -d postgres < "$f"
  done
else
  echo "  customer_profiles already exists, skipping migrations."
fi

echo "Bootstrap done. Restarting dependent services..."
docker restart seyfarth-auth seyfarth-rest seyfarth-storage >/dev/null 2>&1 || true
echo "OK."
