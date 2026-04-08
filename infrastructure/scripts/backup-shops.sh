#!/bin/bash
# Taegliches Backup aller Shops
# Cron: 0 3 * * * /opt/scripts/backup-shops.sh >> /var/log/shop-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS=30

echo "=== Backup gestartet: $(date) ==="

SHOP_COUNT=0
for shop_dir in /opt/shops/*/; do
  [[ ! -d "$shop_dir" ]] && continue
  SHOP_NAME=$(basename "$shop_dir")
  SHOP_BACKUP="${BACKUP_DIR}/${SHOP_NAME}/${DATE}"
  mkdir -p "${SHOP_BACKUP}"

  # PostgreSQL Dump
  if docker exec ${SHOP_NAME}-postgres pg_dump -U medusa medusa_db 2>/dev/null | gzip > "${SHOP_BACKUP}/postgres.sql.gz"; then
    echo "OK: pg_dump fuer $SHOP_NAME"
  else
    echo "WARN: pg_dump fehlgeschlagen fuer $SHOP_NAME"
    rm -f "${SHOP_BACKUP}/postgres.sql.gz"
  fi

  # .env Backup (enthaelt Secrets)
  cp "/opt/shops/$SHOP_NAME/.env" "${SHOP_BACKUP}/env.backup" 2>/dev/null || true

  # docker-compose.yml Backup
  cp "/opt/shops/$SHOP_NAME/docker-compose.yml" "${SHOP_BACKUP}/docker-compose.yml.backup" 2>/dev/null || true

  SHOP_COUNT=$((SHOP_COUNT + 1))
  echo "Backup: $SHOP_NAME -> $SHOP_BACKUP"
done

if [[ $SHOP_COUNT -eq 0 ]]; then
  echo "Keine Shops gefunden unter /opt/shops/"
fi

# Alte Backups loeschen
DELETED=$(find ${BACKUP_DIR} -maxdepth 2 -type d -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l | tr -d ' ')
find ${BACKUP_DIR} -maxdepth 2 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} + 2>/dev/null || true
echo "Alte Backups geloescht: $DELETED Verzeichnisse (aelter als ${RETENTION_DAYS} Tage)"

echo "=== Backup abgeschlossen: $(date) - $SHOP_COUNT Shops gesichert ==="
