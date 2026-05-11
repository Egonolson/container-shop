#!/bin/bash
set -euo pipefail

# Farben
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

TEMPLATE_DIR="/opt/medusa-template"
SHOPS_DIR="/opt/shops"
SCRIPTS_DIR="/opt/scripts"

# -- Parameter --
usage() {
  echo "Usage: $0 --name <shop-name> --domain <shop.example.com> --port <8100> --admin-email <admin@example.com> [--source <path-to-code>]"
  exit 1
}

SHOP_NAME="" SHOP_DOMAIN="" NGINX_PORT="" ADMIN_EMAIL="" SOURCE_DIR=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --name) SHOP_NAME="$2"; shift 2;;
    --domain) SHOP_DOMAIN="$2"; shift 2;;
    --port) NGINX_PORT="$2"; shift 2;;
    --admin-email) ADMIN_EMAIL="$2"; shift 2;;
    --source) SOURCE_DIR="$2"; shift 2;;
    *) usage;;
  esac
done

[[ -z "$SHOP_NAME" || -z "$SHOP_DOMAIN" || -z "$NGINX_PORT" || -z "$ADMIN_EMAIL" ]] && usage

# -- Validierung --
if [[ -d "$SHOPS_DIR/$SHOP_NAME" ]]; then
  echo -e "${RED}Error: Shop '$SHOP_NAME' existiert bereits unter $SHOPS_DIR/$SHOP_NAME${NC}"
  exit 1
fi

if ss -tlnp | grep -q ":$NGINX_PORT "; then
  echo -e "${RED}Error: Port $NGINX_PORT ist bereits belegt${NC}"
  exit 1
fi

if ! [[ "$SHOP_NAME" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo -e "${RED}Error: Shop-Name darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten${NC}"
  exit 1
fi

if ! [[ "$NGINX_PORT" =~ ^[0-9]+$ ]] || [[ "$NGINX_PORT" -lt 1024 ]] || [[ "$NGINX_PORT" -gt 65535 ]]; then
  echo -e "${RED}Error: Port muss zwischen 1024 und 65535 liegen${NC}"
  exit 1
fi

echo ""
echo "========================================"
echo -e "${GREEN} Deploying Shop: $SHOP_NAME${NC}"
echo "========================================"
echo "  Domain: $SHOP_DOMAIN"
echo "  Port:   $NGINX_PORT"
echo "  Admin:  $ADMIN_EMAIL"
echo "========================================"
echo ""

# -- Secrets generieren --
POSTGRES_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 16)

echo -e "${GREEN}[1/10] Secrets generiert${NC}"

# -- Template kopieren --
cp -r "$TEMPLATE_DIR" "$SHOPS_DIR/$SHOP_NAME"
echo -e "${GREEN}[2/10] Template kopiert nach $SHOPS_DIR/$SHOP_NAME${NC}"

# -- .env erstellen --
sed -e "s|__SHOP_NAME__|$SHOP_NAME|g" \
    -e "s|__SHOP_DOMAIN__|$SHOP_DOMAIN|g" \
    -e "s|__NGINX_PORT__|$NGINX_PORT|g" \
    -e "s|__POSTGRES_PASSWORD__|$POSTGRES_PASSWORD|g" \
    -e "s|__JWT_SECRET__|$JWT_SECRET|g" \
    -e "s|__COOKIE_SECRET__|$COOKIE_SECRET|g" \
    -e "s|__ADMIN_EMAIL__|$ADMIN_EMAIL|g" \
    -e "s|__PUBLISHABLE_KEY__|pk_placeholder|g" \
    "$SHOPS_DIR/$SHOP_NAME/.env.template" > "$SHOPS_DIR/$SHOP_NAME/.env"
rm "$SHOPS_DIR/$SHOP_NAME/.env.template"
echo -e "${GREEN}[3/10] .env erstellt${NC}"

# -- Nginx-Config anpassen --
# Nur SHOP_NAME ersetzen, NICHT $host/$scheme etc. (kein envsubst!)
sed -i "s/\${SHOP_NAME}/$SHOP_NAME/g" "$SHOPS_DIR/$SHOP_NAME/nginx.conf"
echo -e "${GREEN}[4/10] nginx.conf angepasst${NC}"

# -- Quellcode kopieren (falls angegeben) --
if [[ -n "$SOURCE_DIR" ]]; then
  if [[ -d "$SOURCE_DIR/backend" ]]; then
    cp -r "$SOURCE_DIR/backend/"* "$SHOPS_DIR/$SHOP_NAME/medusa/"
    echo -e "${GREEN}[5/10] Backend-Code kopiert${NC}"
  else
    echo -e "${YELLOW}[5/10] Kein backend/ Verzeichnis in $SOURCE_DIR gefunden${NC}"
  fi
  if [[ -d "$SOURCE_DIR/storefront" ]]; then
    cp -r "$SOURCE_DIR/storefront/"* "$SHOPS_DIR/$SHOP_NAME/storefront/"
    echo -e "       Storefront-Code kopiert"
  else
    echo -e "${YELLOW}       Kein storefront/ Verzeichnis in $SOURCE_DIR gefunden${NC}"
  fi
else
  echo -e "${YELLOW}[5/10] Kein Quellcode angegeben -- medusa/ und storefront/ manuell befuellen${NC}"
fi

# -- Docker Compose starten --
cd "$SHOPS_DIR/$SHOP_NAME"
docker compose up -d --build
echo -e "${GREEN}[6/10] Stack gestartet${NC}"

# -- Health-Check warten --
echo -e "${YELLOW}[7/10] Warte auf Health-Checks (max 5 Min)...${NC}"
TIMEOUT=300
ELAPSED=0
while [[ $ELAPSED -lt $TIMEOUT ]]; do
  HEALTHY=$(docker compose ps --format json | grep -c '"healthy"' || true)
  TOTAL=$(docker compose ps --format json | wc -l | tr -d ' ')
  echo -ne "\r  Healthy: $HEALTHY/$TOTAL (${ELAPSED}s)"
  [[ $HEALTHY -ge 2 ]] && break  # postgres + redis minimum
  sleep 10
  ELAPSED=$((ELAPSED + 10))
done
echo ""

if [[ $ELAPSED -ge $TIMEOUT ]]; then
  echo -e "${RED}WARNUNG: Health-Check Timeout nach ${TIMEOUT}s${NC}"
  echo "Container-Status:"
  docker compose ps
fi

# -- Admin-User erstellen --
echo -e "${YELLOW}[8/10] Erstelle Admin-User...${NC}"
sleep 10  # Kurz warten bis Medusa vollstaendig gestartet
docker exec ${SHOP_NAME}-medusa npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD" 2>/dev/null || {
  echo -e "${YELLOW}  Admin-User konnte nicht erstellt werden (evtl. Medusa noch nicht bereit).${NC}"
  echo -e "${YELLOW}  Manuell erstellen: docker exec ${SHOP_NAME}-medusa npx medusa user -e $ADMIN_EMAIL -p <passwort>${NC}"
}
echo -e "${GREEN}[8/10] Admin-User erstellt${NC}"

# -- Cloudflare Tunnel Route --
echo -e "${YELLOW}[9/10] Cloudflare Tunnel: Bitte '$SHOP_DOMAIN' -> localhost:$NGINX_PORT manuell im Dashboard hinzufuegen${NC}"
# Automatische Version (wenn CF_API_TOKEN und CF_TUNNEL_ID gesetzt):
# if [[ -n "${CF_API_TOKEN:-}" && -n "${CF_TUNNEL_ID:-}" ]]; then
#   $SCRIPTS_DIR/add-tunnel-route.sh "$SHOP_DOMAIN" "$NGINX_PORT"
# fi

# -- Prometheus Target registrieren --
TARGETS_FILE="/opt/monitoring/prometheus/shop-targets.json"
if [[ -f "$TARGETS_FILE" ]]; then
  python3 -c "
import json
f='$TARGETS_FILE'
with open(f) as fh:
    targets = json.load(fh)
targets.append({
    'targets': ['${SHOP_NAME}-nginx:80'],
    'labels': {'shop': '${SHOP_NAME}', 'job': 'shop-${SHOP_NAME}'}
})
with open(f, 'w') as fh:
    json.dump(targets, fh, indent=2)
" 2>/dev/null && echo -e "${GREEN}[10/10] Prometheus Target registriert${NC}" \
             || echo -e "${YELLOW}[10/10] Prometheus noch nicht eingerichtet -- Target manuell registrieren${NC}"
else
  echo -e "${YELLOW}[10/10] Monitoring noch nicht aktiv -- ueberspringen${NC}"
fi

# -- Zusammenfassung --
echo ""
echo "========================================"
echo -e "${GREEN} Shop '$SHOP_NAME' erfolgreich deployed!${NC}"
echo "========================================"
echo "  Storefront: https://$SHOP_DOMAIN"
echo "  Admin:      https://$SHOP_DOMAIN/app/"
echo "  Admin-User: $ADMIN_EMAIL"
echo "  Admin-Pass: $ADMIN_PASSWORD"
echo "  Pfad:       $SHOPS_DIR/$SHOP_NAME"
echo "  Port:       $NGINX_PORT"
echo "========================================"
echo ""
echo -e "${YELLOW}WICHTIG: Admin-Passwort jetzt notieren!${NC}"
echo -e "${YELLOW}Cloudflare Tunnel Route manuell konfigurieren: $SHOP_DOMAIN -> localhost:$NGINX_PORT${NC}"
