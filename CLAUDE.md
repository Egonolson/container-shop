# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Single-Tenant Onlineshop der Containerdienst Seyfarth. Der öffentliche Shop ist eine **Next.js Anfrage-/Konfiguratorstrecke** für Container, Baustoffe und Transport: Kunden wählen geführt Entsorgung/Baustoffe/Transport, erfassen Abfallart, PLZ/Ort, Containergröße, Stellplatz, Termin und Kontakt. Es gibt bewusst **keine Online-Festpreislogik** für tonnageabhängige Entsorgung — nach dem Absenden prüft Seyfarth Preis, Termin und Verfügbarkeit persönlich. Anfragen werden serverseitig als JSONL im persistenten Docker-Volume abgelegt.

## Tech-Stack (aktiv)

| Schicht | Technologie |
|---------|------------|
| Storefront | Next.js 16 (App Router, Standalone) + Tailwind CSS 4 + shadcn/ui + React Query |
| Anfrage-Ablage | Serverseitiges JSONL im Docker-Volume (`/app/data/shop-requests.jsonl`) |
| Reverse Proxy | Nginx — Security-Header, Rate-Limit (`nginx.seyfarth.conf`) |
| Tunnel | Cloudflare (`tunnel-config.yml`, nur PROD über `--profile prod`) |
| Hosting | Hetzner Cloud (DE), Docker Compose (`docker-compose.seyfarth.yml`) |
| Sprache UI | Deutsch (mit Umlauten) |

> **Historie:** Ursprünglich war ein Medusa.js-v2-Backend mit B2B-Portal (Aufträge, Lieferorte, Dokumente, GewAbfV) geplant — siehe `Projektplan_Onlineshop_Container-Portal.md` und `docs/plans/`. Dieses Backend wurde **vollständig entfernt** und ist nicht mehr Laufzeit-Abhängigkeit. Der öffentliche Shop läuft Medusa-frei.

## Struktur

- `storefront/` — die einzige Anwendung (Next.js). Öffentliche Seiten: `/`, `/checkout`, `/checkout/success`, `/agb`, `/datenschutz`, `/impressum`, API: `/api/shop-requests`.
- `storefront/src/components/public/` — Anfrage-Konfigurator (`seyfarth-configurator.tsx`), Shell, Header/Footer, Cookie-Banner.
- `storefront/src/lib/seyfarth-shop-data.ts` — Produkt-/Konfigurator-Daten und Formular-Version (Single Source).
- `docker-compose.seyfarth.yml` — aktive Runtime (DEV `hetzner-claw` / PROD `hetzner-prod`, Port 8092).
- `deploy.sh` — Deploy nach DEV/PROD.

## Konventionen

- Sprache im Code: Englisch (Variablen, Kommentare, Commits); Sprache in der UI: Deutsch mit korrekten Umlauten.
- Commit-Messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
- Alle Services laufen als Docker-Container.
- DSGVO-Konformität: Hosting in DE, keine externen Tracker.
- Vor PROD-Rollout: DEV-first auf `hetzner-claw`, `npm run typecheck` + `npm run build` grün, HTTP-/Browser-Smoke.
