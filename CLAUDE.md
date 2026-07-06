# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Single-Tenant Onlineshop **+ Kundenportal** der Containerdienst Seyfarth. Der öffentliche Shop ist eine **Next.js Anfrage-/Konfiguratorstrecke** für Container, Baustoffe und Transport: Kunden wählen geführt Entsorgung/Baustoffe/Transport, erfassen Abfallart, PLZ/Ort, Containergröße, Stellplatz, Termin und Kontakt. Es gibt bewusst **keine Online-Festpreislogik** für tonnageabhängige Entsorgung — nach dem Absenden prüft Seyfarth Preis, Termin und Verfügbarkeit persönlich.

Seit dem R1-Portal-Ausbau (2026-07, PR #5) läuft dahinter ein **self-hosted Supabase-Stack** (Auth/DB/REST/Storage/Kong): Anfragen liegen in Postgres (`shop_requests`) statt JSONL, es gibt Kundenkonten (privat/gewerblich, Gast weiterhin möglich), Baustellen-/Standortverwaltung, Geo-Pin (OSM/Leaflet) + Stellplatzfoto, ein Admin-Backoffice (`/admin`) inkl. admin-gepflegtem SMTP, und Anfrage-Benachrichtigungen per Mail.

## Tech-Stack (aktiv)

| Schicht | Technologie |
|---------|------------|
| Storefront | Next.js 16 (App Router, Standalone) + Tailwind CSS 4 + shadcn/ui + React Query |
| Auth/DB/Storage | Self-hosted Supabase (`supabase/postgres`, `gotrue`, `postgrest`, `storage-api`, `kong`) hinter Nginx, Single-Port; Compose-Profil `supabase` |
| Datenmodell | Postgres mit RLS: `customer_profiles`, `shop_requests`, `construction_sites`, `app_smtp_settings`; Migrationen in `supabase/migrations/`, getrackt in `public._app_migrations` |
| Karte | Leaflet + OpenStreetMap (Kachel-Hosts in der Nginx-CSP freigegeben) |
| Mail | nodemailer, SMTP im Backoffice pflegbar (verschlüsselt in `app_smtp_settings`); GoTrue-Registrierungsmail via `supabase/scripts/sync-smtp-to-gotrue.sh` |
| Reverse Proxy | Nginx — Security-Header/CSP, Rate-Limit, Same-Origin-Proxy zu Kong (`nginx.seyfarth.conf`) |
| Tunnel | Cloudflare — PROD über den geteilten `cloudflared-kirk` (NICHT das Compose-`seyfarth-tunnel`) |
| Hosting | Hetzner Cloud (DE), Docker Compose (`docker-compose.seyfarth.yml`), Port 8092 |
| Sprache UI | Deutsch (mit Umlauten) |

> **Historie:** Ursprünglich war ein Medusa.js-v2-Backend geplant und dann vollständig entfernt; der Shop lief eine Weile Medusa-frei als reine JSONL-Anfragestrecke. Beides ist überholt — maßgeblich ist der Supabase-Portal-Stand oben. Alt-Pläne unter `docs/plans/`.

## Struktur

- `storefront/` — die einzige Anwendung (Next.js). Öffentlich: `/`, `/checkout`, `/agb`, `/datenschutz`, `/impressum`; Portal: `/login`, `/registrieren`, `/konto`; Admin: `/admin`, `/admin/login`, `/admin/smtp`; API: `/api/shop-requests`.
- `storefront/src/components/public/` — Anfrage-Konfigurator (`seyfarth-configurator.tsx`), Karte (`placement-map.tsx`), Shell, Header/Footer, Cookie-Banner.
- `storefront/src/lib/` — `seyfarth-shop-data.ts` (Produkt-/Konfigurator-Daten), `supabase/` (client/server/admin/middleware/types), `email.ts`, `crypto.ts`, `config.ts` (Feature-Flags).
- `supabase/migrations/` — DB-Migrationen; `supabase/db/bootstrap.sh` — idempotentes DB-Setup (Rollen-Fixes + Migrations-Tracking); `supabase/kong/` — Kong-Config-Template; `supabase/scripts/` — SMTP→GoTrue-Sync.
- `docker-compose.seyfarth.yml` — aktive Runtime (DEV `hetzner-claw` / PROD `hetzner-prod`, Port 8092). `deploy.sh` — Deploy (`dev`/`prod`, beide `--profile supabase`).

## Feature-Flags / Betrieb

- `NEXT_PUBLIC_REGISTRATION_ENABLED` (Build-Arg): bei `false` (PROD, bis SMTP steht) ist die Registrierung aus, Gewerbekunden können ohne Konto als Gast anfragen, `/registrieren` zeigt einen Hinweis. `GOTRUE_DISABLE_SIGNUP` spiegelt das serverseitig.
- Registrierung freischalten: SMTP im Backoffice pflegen → `bash supabase/scripts/sync-smtp-to-gotrue.sh` → Storefront mit `NEXT_PUBLIC_REGISTRATION_ENABLED=true` neu deployen.
- Secrets liegen in `.env.dev`/`.env.prod` (gitignored, nie committen): `SUPABASE_*`, `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_KEY` (server-only Runtime-env), SMTP-Platzhalter.

## Konventionen

- Sprache im Code: Englisch (Variablen, Kommentare, Commits); Sprache in der UI: Deutsch mit korrekten Umlauten.
- Commit-Messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
- Alle Services laufen als Docker-Container. RLS auf jeder neuen Tabelle; Service-Key nur server-seitig, nie `NEXT_PUBLIC`.
- DSGVO-Konformität: Hosting in DE, keine externen Tracker (OSM-Kacheln same-origin über die freigegebene CSP).
- Vor PROD-Rollout: DEV-first auf `hetzner-claw`, `npm run typecheck` + `npm run build` grün, HTTP-/Browser-Smoke; PROD ist GELB (menschliche Freigabe je Deploy); `--remove-orphans` auf PROD vermeiden (Legacy-`seyfarth-postgres`).
