#!/usr/bin/env bash
# Applies the admin-managed SMTP settings (stored/encrypted in the DB) to
# GoTrue so registration confirmation mails work. GoTrue only reads SMTP from
# its env at startup, so this writes the values into the repo-root .env
# (which compose maps onto GOTRUE_SMTP_*) and recreates seyfarth-auth.
#
# Also flips GOTRUE_DISABLE_SIGNUP to false — once mail works, sign-ups can be
# accepted. (The client-facing NEXT_PUBLIC_REGISTRATION_ENABLED flag is a
# build arg; set it to true and redeploy to also show the registration UI.)
#
# Usage (from repo root, on the server): bash supabase/scripts/sync-smtp-to-gotrue.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
COMPOSE_FILE="$REPO_ROOT/docker-compose.seyfarth.yml"

echo "Reading + decrypting SMTP settings from the DB (inside storefront container)..."
SMTP_LINES="$(docker exec -i seyfarth-storefront node < "$SCRIPT_DIR/read-smtp-env.cjs")"
if [ -z "$SMTP_LINES" ]; then
  echo "ERROR: no SMTP settings returned."
  exit 1
fi

echo "Writing SMTP_* + GOTRUE_DISABLE_SIGNUP into $ENV_FILE ..."
# Safe in-place update: python rewrites matching keys, appends missing ones,
# handling arbitrary values (passwords with special chars).
SMTP_LINES="$SMTP_LINES" ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os
env_file = os.environ["ENV_FILE"]
updates = {}
for line in os.environ["SMTP_LINES"].splitlines():
    if "=" in line:
        k, v = line.split("=", 1)
        updates[k] = v
updates["GOTRUE_DISABLE_SIGNUP"] = "false"

try:
    with open(env_file) as f:
        lines = f.read().splitlines()
except FileNotFoundError:
    lines = []

seen = set()
out = []
for line in lines:
    if "=" in line and not line.lstrip().startswith("#"):
        k = line.split("=", 1)[0]
        if k in updates:
            out.append(f"{k}={updates[k]}")
            seen.add(k)
            continue
    out.append(line)
for k, v in updates.items():
    if k not in seen:
        out.append(f"{k}={v}")

with open(env_file, "w") as f:
    f.write("\n".join(out) + "\n")
print("  ok")
PY

echo "Recreating seyfarth-auth to pick up the new SMTP env..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --force-recreate seyfarth-auth

echo "Done. GoTrue now uses the stored SMTP and accepts sign-ups."
echo "Note: to also show the registration UI, rebuild the storefront with"
echo "NEXT_PUBLIC_REGISTRATION_ENABLED=true (set it in .env and redeploy)."
