#!/bin/bash
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

SHOP_NAME="${1:-}"
[[ -z "$SHOP_NAME" ]] && { echo "Usage: $0 <shop-name>"; exit 1; }

SHOP_DIR="/opt/shops/$SHOP_NAME"
[[ ! -d "$SHOP_DIR" ]] && { echo -e "${RED}Shop '$SHOP_NAME' nicht gefunden unter $SHOP_DIR${NC}"; exit 1; }

echo -e "${RED}WARNUNG: Shop '$SHOP_NAME' wird komplett geloescht!${NC}"
echo "  - Alle Container werden gestoppt"
echo "  - Alle Volumes (inkl. Datenbank) werden geloescht"
echo "  - Das Verzeichnis $SHOP_DIR wird entfernt"
echo ""
read -p "Sicher? (ja/nein): " CONFIRM
[[ "$CONFIRM" != "ja" ]] && { echo "Abbruch."; exit 0; }

echo -e "${YELLOW}Stoppe Container...${NC}"
cd "$SHOP_DIR"
docker compose down -v

# Prometheus Target entfernen
TARGETS_FILE="/opt/monitoring/prometheus/shop-targets.json"
if [[ -f "$TARGETS_FILE" ]]; then
  python3 -c "
import json
f='$TARGETS_FILE'
with open(f) as fh:
    targets = json.load(fh)
targets = [t for t in targets if t.get('labels', {}).get('shop') != '$SHOP_NAME']
with open(f, 'w') as fh:
    json.dump(targets, fh, indent=2)
" 2>/dev/null && echo -e "${GREEN}Prometheus Target entfernt${NC}" || true
fi

echo -e "${YELLOW}Loesche Verzeichnis...${NC}"
rm -rf "$SHOP_DIR"

echo -e "${GREEN}Shop '$SHOP_NAME' vollstaendig entfernt.${NC}"
echo -e "${YELLOW}Vergiss nicht, die Cloudflare Tunnel Route fuer $SHOP_NAME zu entfernen!${NC}"
