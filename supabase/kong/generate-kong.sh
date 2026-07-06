#!/usr/bin/env bash
# Generates kong.yml from kong.yml.template with real secrets from the
# repo-root .env file (which deploy.sh copies onto the server — never in git).
# Must be re-run after every deploy that changes kong.yml.template or .env.
#
# Usage (from repo root, on the server): bash supabase/kong/generate-kong.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
TEMPLATE="$SCRIPT_DIR/kong.yml.template"
OUTPUT="$SCRIPT_DIR/kong.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE not found!"
  exit 1
fi

ANON=$(grep '^SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)
SVC=$(grep '^SUPABASE_SERVICE_KEY=' "$ENV_FILE" | cut -d= -f2-)
SITE=$(grep '^SITE_URL=' "$ENV_FILE" | cut -d= -f2-)

if [ -z "$ANON" ] || [ -z "$SVC" ] || [ -z "$SITE" ]; then
  echo "ERROR: SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY or SITE_URL missing in $ENV_FILE!"
  exit 1
fi

sed -e "s|\${SUPABASE_ANON_KEY}|$ANON|g" \
    -e "s|\${SUPABASE_SERVICE_KEY}|$SVC|g" \
    -e "s|\${SITE_URL}|$SITE|g" \
    "$TEMPLATE" > "$OUTPUT"

echo "kong.yml generated from template with real keys."
