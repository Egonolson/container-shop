# Containerdienst Seyfarth — Production-Ready Handoff

Stand: 2026-05-11
Umgebung: DEV `https://seyfarth-dev.visionmakegpt.work/`
Branch: `feature/seyfarth-onepage-design`

## Zielbild

Der öffentliche Shop ist als eigene Next.js Anfrage-/Konfiguratorstrecke umgesetzt und nicht mehr von Medusa als Laufzeit-Backend abhängig. Anfragen werden serverseitig als JSONL in einem persistenten Docker-Volume gespeichert.

## Release-Gates

- `npm run typecheck`: grün
- `npm run build`: grün
- `npm audit --omit=dev --audit-level=high`: grün gegen High/Critical; verbleibend nur moderate Next/PostCSS Advisory ohne nicht-brechenden Fix
- `git diff --check`: grün
- `docker compose -p seyfarth -f docker-compose.seyfarth.yml config --quiet`: grün
- `docker exec seyfarth-nginx nginx -t`: grün
- DEV Runtime: `seyfarth-storefront` healthy, `seyfarth-nginx` up
- HTTP-Smoke: `/`, `/datenschutz`, `/impressum`, `/agb`, `/robots.txt`, `/sitemap.xml` jeweils 200
- Legacy/Admin: `/admin/` und `/store/` liefern 404
- API-Smoke: gültige Anfrage 200, ungültige Anfrage 422
- Browser-QA: Anfrage erfolgreich bis Referenz `SEY-20260511-F772E545`, Console ohne JS-Fehler
- Textscan deutsche Umlautqualität: 0 Kandidaten
- Secret-Scan geänderte Dateien: 0 Kandidaten

## Bewusste Hinweise

- `shadcn` bleibt als Dev-Dependency erhalten, weil `globals.css` aktuell `shadcn/tailwind.css` importiert.
- Ein alter Orphan-Container `seyfarth-postgres` läuft noch auf DEV. Nicht automatisch entfernen; vor Cleanup Daten-/Rollback-Relevanz prüfen.
- Im Gesamtrepo existieren alte `.env*` und Legacy-Dokumentationskandidaten mit Secret-ähnlichen Mustern. Sie sind nicht Teil des aktuellen Changesets und wurden nicht ausgegeben/committet. Cleanup separat planen.
- PROD-Deployment bleibt GELB und braucht explizite Freigabe plus Backup-/Rollback-Basis.

## Rollback DEV

```bash
cd /mnt/HC_Volume_105075389/workspaces/project-manager/_remote-first/containershop
git revert <release-commit>
docker compose -p seyfarth -f docker-compose.seyfarth.yml up -d --build seyfarth-storefront seyfarth-nginx
```

## PROD-Vorgehen nach Freigabe

1. Frische Backup-Basis auf Zielhost erstellen.
2. Release-Commit/Tag als Quelle festlegen.
3. Artefakt/Checkout deterministisch auf PROD synchronisieren.
4. `docker compose config --quiet`, Build, `nginx -t`.
5. Cloudflare/Tunnel aktivieren bzw. Zielhost-Routing prüfen.
6. Smokes wiederholen: HTTP, API, Browser-Anfrage, Header, Secret-Scan.
