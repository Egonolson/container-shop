#!/usr/bin/env bash
# ============================================================
# Seyfarth Container-Portal — Deploy Script
# Usage:
#   ./deploy.sh dev     → Deploy to hetzner-claw (Dev)
#   ./deploy.sh prod    → Deploy to hetzner-prod (Prod)
# ============================================================
set -euo pipefail

REPO_DIR="/opt/seyfarth"
COMPOSE_FILE="docker-compose.seyfarth.yml"

DEV_HOST="hetzner-claw"
PROD_HOST="hetzner-prod"

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Usage: ./deploy.sh [dev|prod]"
  exit 1
fi

# Determine host and env file
case "$TARGET" in
  dev)
    HOST="$DEV_HOST"
    ENV_FILE=".env.dev"
    # Self-hosted Supabase (Auth/DB/REST/Storage) is DEV-only for now — see
    # release plan R0/R1. PROD does not have SUPABASE_* secrets yet, so its
    # compose invocation below intentionally does NOT activate this profile.
    PROFILE_FLAG="--profile supabase"
    echo "🚀 Deploying to DEV ($DEV_HOST)..."
    ;;
  prod)
    HOST="$PROD_HOST"
    ENV_FILE=".env.prod"
    PROFILE_FLAG="--profile prod"
    if [ ! -f ".env.prod" ]; then
      echo "❌ .env.prod not found! Copy .env.prod.template and fill in real values."
      exit 1
    fi
    echo "🚀 Deploying to PROD ($PROD_HOST)..."
    ;;
  *)
    echo "❌ Unknown target: $TARGET. Use: dev|prod"
    exit 1
    ;;
esac

# 1. Sync files to server
echo "📦 Syncing files to $HOST:$REPO_DIR ..."
ssh "$HOST" "mkdir -p $REPO_DIR"
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='*.log' \
  --exclude='.env*' \
  . "$HOST:$REPO_DIR/"

# 2. Copy env file
echo "🔐 Copying env file..."
scp "$ENV_FILE" "$HOST:$REPO_DIR/.env"

if [ "$TARGET" = "dev" ]; then
  echo "🔧 Generating kong.yml from template..."
  ssh "$HOST" "cd $REPO_DIR && bash supabase/kong/generate-kong.sh"
fi

# 3. Build & start
echo "🐳 Building and starting containers..."
ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env pull --ignore-pull-failures 2>/dev/null; true"
ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env build --no-cache"

if [ "$TARGET" = "dev" ]; then
  # Supabase Postgres needs to be up (and password/ownership-fixed, see
  # bootstrap.sh) before auth/rest/storage can connect successfully — start
  # it first, bootstrap, then bring up the rest of the stack.
  echo "🐘 Starting seyfarth-db first (supabase profile)..."
  ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env $PROFILE_FLAG up -d seyfarth-db"
  echo "🔧 Bootstrapping database (idempotent)..."
  ssh "$HOST" "cd $REPO_DIR && bash supabase/db/bootstrap.sh"
fi

ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env $PROFILE_FLAG up -d --remove-orphans"

# 4. Wait for storefront
echo "⏳ Waiting for Storefront to be ready..."
ATTEMPTS=0
until ssh "$HOST" "docker exec seyfarth-storefront node -e \"fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"" 2>/dev/null || [ $ATTEMPTS -gt 30 ]; do
  sleep 5
  ATTEMPTS=$((ATTEMPTS+1))
  echo "  ... attempt $ATTEMPTS/30"
done

if [ $ATTEMPTS -gt 30 ]; then
  echo "⚠️  Storefront took too long. Check logs: ssh $HOST 'docker logs seyfarth-storefront --tail 50'"
else
  echo "✅ Storefront is up!"
fi

echo ""
echo "================================================"
echo "✅ Deploy to $TARGET done!"
echo ""
if [ "$TARGET" = "dev" ]; then
  echo "  🌍 Dev URL: https://seyfarth-dev.visionmakegpt.work"
else
  echo "  🌍 Prod URL: https://seyfarth.visionmakegpt.work"
fi
echo "================================================"
