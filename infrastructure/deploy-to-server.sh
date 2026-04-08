#!/bin/bash
# Deploy Multi-Shop Infrastructure to Hetzner Server
# Usage: ./deploy-to-server.sh
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
SSH_HOST="hetzner-docker"
INFRA_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo -e "${GREEN} Multi-Shop Infrastructure Deploy${NC}"
echo "========================================"
echo "  Server: $SSH_HOST"
echo "  Source: $INFRA_DIR"
echo "========================================"
echo ""

# 1. Verzeichnisse auf dem Server erstellen
echo -e "${YELLOW}[1/5] Erstelle Server-Verzeichnisse...${NC}"
ssh "$SSH_HOST" '
  mkdir -p /opt/medusa-template/{medusa,storefront}
  mkdir -p /opt/shops
  mkdir -p /opt/scripts
  mkdir -p /opt/backups
  mkdir -p /opt/monitoring/{prometheus/alerts,grafana/dashboards,grafana/datasources,alertmanager}
'
echo -e "${GREEN}  OK${NC}"

# 2. Docker-Netzwerke erstellen
echo -e "${YELLOW}[2/5] Docker-Netzwerke erstellen...${NC}"
ssh "$SSH_HOST" '
  docker network create proxy 2>/dev/null && echo "  Netzwerk proxy erstellt" || echo "  Netzwerk proxy existiert bereits"
  docker network create monitoring 2>/dev/null && echo "  Netzwerk monitoring erstellt" || echo "  Netzwerk monitoring existiert bereits"
'
echo -e "${GREEN}  OK${NC}"

# 3. Dateien hochladen
echo -e "${YELLOW}[3/5] Lade Dateien hoch...${NC}"

# Medusa Template (inkl. Dot-Files wie .env.template)
scp -r "$INFRA_DIR/medusa-template/"* "$SSH_HOST:/opt/medusa-template/"
scp "$INFRA_DIR/medusa-template/".* "$SSH_HOST:/opt/medusa-template/" 2>/dev/null || true
echo "  medusa-template/ hochgeladen"

# Scripts
scp "$INFRA_DIR/scripts/"*.sh "$SSH_HOST:/opt/scripts/"
echo "  scripts/ hochgeladen"

# Monitoring
scp "$INFRA_DIR/monitoring/docker-compose.yml" "$SSH_HOST:/opt/monitoring/"
scp "$INFRA_DIR/monitoring/prometheus/"*.yml "$SSH_HOST:/opt/monitoring/prometheus/"
scp "$INFRA_DIR/monitoring/prometheus/shop-targets.json" "$SSH_HOST:/opt/monitoring/prometheus/"
scp "$INFRA_DIR/monitoring/prometheus/alerts/"*.yml "$SSH_HOST:/opt/monitoring/prometheus/alerts/"
scp "$INFRA_DIR/monitoring/alertmanager/"*.yml "$SSH_HOST:/opt/monitoring/alertmanager/"
scp "$INFRA_DIR/monitoring/grafana/datasources/"*.yml "$SSH_HOST:/opt/monitoring/grafana/datasources/"
scp "$INFRA_DIR/monitoring/grafana/dashboards/"*.yml "$SSH_HOST:/opt/monitoring/grafana/dashboards/"
echo "  monitoring/ hochgeladen"

echo -e "${GREEN}  OK${NC}"

# 4. Berechtigungen setzen
echo -e "${YELLOW}[4/5] Setze Berechtigungen...${NC}"
ssh "$SSH_HOST" 'chmod +x /opt/scripts/*.sh'
echo -e "${GREEN}  OK${NC}"

# 5. Cron-Job einrichten (Backup)
echo -e "${YELLOW}[5/5] Richte Backup-Cron ein...${NC}"
ssh "$SSH_HOST" '
  if crontab -l 2>/dev/null | grep -q "backup-shops.sh"; then
    echo "  Backup-Cron existiert bereits"
  else
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/scripts/backup-shops.sh >> /var/log/shop-backup.log 2>&1") | crontab -
    echo "  Backup-Cron eingerichtet (taeglich 3:00 Uhr)"
  fi
'
echo -e "${GREEN}  OK${NC}"

echo ""
echo "========================================"
echo -e "${GREEN} Infrastructure erfolgreich deployed!${NC}"
echo "========================================"
echo ""
echo "Naechste Schritte:"
echo "  1. Monitoring starten:"
echo "     ssh $SSH_HOST 'cd /opt/monitoring && echo \"GRAFANA_PASSWORD=\$(openssl rand -hex 16)\" > .env && docker compose up -d'"
echo ""
echo "  2. Neuen Shop deployen:"
echo "     ssh $SSH_HOST '/opt/scripts/deploy-shop.sh --name meinshop --domain meinshop.visionmakegpt.work --port 8100 --admin-email admin@example.de'"
echo ""
echo "  3. Cloudflare Tunnel Routes konfigurieren:"
echo "     - grafana.visionmakegpt.work -> localhost:3002"
echo "     - <shop>.visionmakegpt.work -> localhost:<port>"
echo ""
