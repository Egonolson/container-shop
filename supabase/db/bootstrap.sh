#!/usr/bin/env bash
# One-time (but idempotent) bootstrap for a fresh seyfarth-db volume:
#   1. sets passwords on internal Supabase roles (the postgres image creates
#      them without a password, so auth/rest/storage can't connect otherwise)
#   2. fixes auth.uid()/role()/email() ownership so gotrue can start
#   3. grants supabase_storage_admin the roles it needs to set RLS context
#   4. applies our own migrations, skipping if already applied
#
# See the supabase-self-hosted-docker skill for why each step is needed.
#
# IMPORTANT: `postgres` is NOT a real superuser in this image (only
# CREATEROLE) — `supabase_admin` is. Whether a given ALTER/GRANT on the
# internal supabase_* roles succeeds as `postgres` has been observed to be
# inconsistent between runs (works right after first init, fails on a
# later re-run against the same volume) — so every step that touches role
# passwords, ownership, or membership runs as `supabase_admin` here, not
# `postgres`. supabase_admin's password is provisioned by the postgres
# image at first init to match POSTGRES_PASSWORD, so PGPASSWORD is read
# from the container's own environment — the secret is never printed or
# passed as a CLI arg.
#
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

as_admin() {
  docker exec -i "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1'
}

echo "Waiting for $CONTAINER to accept connections..."
until docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; do sleep 2; done

echo "Fixing internal role passwords (idempotent)..."
# Unquoted heredoc so $PW is substituted locally before piping into psql via
# stdin (never echoed/printed — psql's -v mechanism can't be used here since
# the as_admin() wrapper doesn't forward extra args into its inner sh -c).
as_admin <<-EOSQL
  ALTER USER authenticator          WITH PASSWORD '$PW';
  ALTER USER supabase_auth_admin    WITH PASSWORD '$PW';
  ALTER USER supabase_storage_admin WITH PASSWORD '$PW';
EOSQL

echo "Fixing auth function ownership (idempotent)..."
as_admin <<-'EOSQL'
  GRANT supabase_auth_admin TO supabase_admin;
  ALTER FUNCTION auth.uid()   OWNER TO supabase_auth_admin;
  ALTER FUNCTION auth.role()  OWNER TO supabase_auth_admin;
  ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;
EOSQL

echo "Granting storage-admin role memberships (idempotent)..."
as_admin <<-'EOSQL'
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
