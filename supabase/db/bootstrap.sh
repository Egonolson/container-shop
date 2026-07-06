#!/usr/bin/env bash
# One-time (but idempotent) bootstrap for a fresh seyfarth-db volume:
#   1. sets passwords on internal Supabase roles (the postgres image creates
#      them without a password, so auth/rest/storage can't connect otherwise)
#   2. fixes auth.uid()/role()/email() ownership so gotrue can start
#   3. grants supabase_storage_admin the roles it needs to set RLS context
#   4. applies pending migrations, tracked per-file in public._app_migrations
#      (so a redeploy against an existing volume applies only new ones)
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

# Tuples-only query as supabase_admin; SQL on stdin, result on stdout.
admin_scalar() {
  docker exec -i "$CONTAINER" sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d postgres -tA'
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

echo "Applying pending app migrations (tracked in public._app_migrations)..."
# Migrations run as supabase_admin (superuser): the storage-policy migration
# needs ownership of storage.objects, and email_has_account() (SECURITY
# DEFINER over auth.users) must be owned by a role that can read auth.users.
printf '%s\n' \
  "create table if not exists public._app_migrations (name text primary key, applied_at timestamptz not null default now());" \
  "revoke all on public._app_migrations from anon, authenticated;" | as_admin

# Backfill for pre-existing volumes: the very first migration was applied by
# the old bootstrap (as postgres) before this tracking table existed. If its
# table is already present, record it as applied so we don't try to re-run it.
if [ -n "$(printf '%s\n' "select to_regclass('public.customer_profiles');" | admin_scalar)" ]; then
  printf '%s\n' "insert into public._app_migrations(name) values ('20260706104434_customer_profiles.sql') on conflict do nothing;" | as_admin
fi

for f in "$REPO_ROOT"/supabase/migrations/*.sql; do
  name=$(basename "$f")
  applied=$(printf '%s\n' "select 1 from public._app_migrations where name = '$name';" | admin_scalar)
  if [ -n "$applied" ]; then
    echo "  = $name (already applied)"
    continue
  fi
  echo "  -> $name"
  as_admin < "$f"
  printf '%s\n' "insert into public._app_migrations(name) values ('$name');" | as_admin
done

echo "Bootstrap done. Restarting dependent services..."
docker restart seyfarth-auth seyfarth-rest seyfarth-storage >/dev/null 2>&1 || true
echo "OK."
