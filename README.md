# container-shop

Single-Tenant Onlineshop der Containerdienst Seyfarth — öffentliche **Next.js Anfrage-/Konfiguratorstrecke** für Container, Baustoffe und Transport. Anfragen werden serverseitig als JSONL im persistenten Docker-Volume abgelegt; Nginx liefert Security-Header und Rate-Limit.

> Hinweis: Das ursprünglich geplante Medusa.js-Backend ist nicht mehr Teil des Stacks (siehe `CLAUDE.md`).

## Stack

- **Storefront:** Next.js 16 + Tailwind CSS 4 + shadcn/ui (`storefront/`)
- **Reverse Proxy:** Nginx (`nginx.seyfarth.conf`)
- **Runtime:** Docker Compose (`docker-compose.seyfarth.yml`)
- **Tunnel:** Cloudflare (`tunnel-config.yml`)

## Lokale Entwicklung

```bash
cd storefront
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build
```

## Deployment

```bash
./deploy.sh dev    # hetzner-claw  → seyfarth-dev.visionmakegpt.work
./deploy.sh prod   # hetzner-prod  → seyfarth.visionmakegpt.work
```
