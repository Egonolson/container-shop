#!/usr/bin/env bash
# ============================================================
# Seyfarth Container-Portal — Deploy Script
# Usage:
#   ./deploy.sh dev     → Deploy to hetzner-claw (Dev)
#   ./deploy.sh prod    → Deploy to hetzner-prod (Prod)
#   ./deploy.sh seed    → Run seed-services on active server
# ============================================================
set -euo pipefail

REPO_DIR="/opt/seyfarth"
COMPOSE_FILE="docker-compose.seyfarth.yml"

DEV_HOST="hetzner-claw"
PROD_HOST="hetzner-prod"

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  echo "Usage: ./deploy.sh [dev|prod|seed-dev|seed-prod]"
  exit 1
fi

# Determine host and env file
case "$TARGET" in
  dev)
    HOST="$DEV_HOST"
    ENV_FILE=".env.dev"
    echo "🚀 Deploying to DEV ($DEV_HOST)..."
    ;;
  prod)
    HOST="$PROD_HOST"
    ENV_FILE=".env.prod"
    if [ ! -f ".env.prod" ]; then
      echo "❌ .env.prod not found! Copy .env.prod.template and fill in real values."
      exit 1
    fi
    echo "🚀 Deploying to PROD ($PROD_HOST)..."
    ;;
  seed-dev)
    HOST="$DEV_HOST"
    echo "🌱 Running seed-services on DEV..."
    ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE exec seyfarth-medusa npx medusa exec src/scripts/seed-services.ts"
    echo "✅ Seed done on DEV"
    exit 0
    ;;
  seed-prod)
    HOST="$PROD_HOST"
    echo "🌱 Running seed-services on PROD..."
    ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE exec seyfarth-medusa npx medusa exec src/scripts/seed-services.ts"
    echo "✅ Seed done on PROD"
    exit 0
    ;;
  *)
    echo "❌ Unknown target: $TARGET. Use: dev|prod|seed-dev|seed-prod"
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

# 3. Build & start
echo "🐳 Building and starting containers..."
ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env pull --ignore-pull-failures 2>/dev/null; true"
ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env build --no-cache"

if [ "$TARGET" = "prod" ]; then
  ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env --profile prod up -d --remove-orphans"
else
  ssh "$HOST" "cd $REPO_DIR && docker compose -f $COMPOSE_FILE --env-file .env up -d --remove-orphans"
fi

# 4. Wait for medusa
echo "⏳ Waiting for Medusa to be ready..."
ATTEMPTS=0
until ssh "$HOST" "docker exec seyfarth-medusa wget -qO- http://localhost:9000/health 2>/dev/null | grep -q 'ok'" 2>/dev/null || [ $ATTEMPTS -gt 30 ]; do
  sleep 5
  ATTEMPTS=$((ATTEMPTS+1))
  echo "  ... attempt $ATTEMPTS/30"
done

if [ $ATTEMPTS -gt 30 ]; then
  echo "⚠️  Medusa took too long. Check logs: ssh $HOST 'docker logs seyfarth-medusa --tail 50'"
else
  echo "✅ Medusa is up!"
fi

echo ""
echo "================================================"
echo "✅ Deploy to $TARGET done!"
echo ""
if [ "$TARGET" = "dev" ]; then
  echo "  🌍 Dev URL: https://seyfarth-dev.visionmakegpt.work"
  echo "  🔑 Get publishable key from admin panel:"
  echo "     https://seyfarth-dev.visionmakegpt.work/admin"
  echo ""
  echo "  🌱 Seed all products:"
  echo "     ./deploy.sh seed-dev"
else
  echo "  🌍 Prod URL: https://seyfarth.visionmakegpt.work"
  echo "  🔑 Get publishable key from admin panel:"
  echo "     https://seyfarth.visionmakegpt.work/admin"
  echo ""
  echo "  🌱 Seed all products:"
  echo "     ./deploy.sh seed-prod"
fi
echo "================================================"
