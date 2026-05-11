# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

B2B-Onlineshop für einen Entsorgungs- und Schüttgut-Betrieb (Single-Tenant). Gewerbekunden bestellen Container-Services (Stellen, Abholen, Wechseln), verwalten Lieferorte und Dokumente. Detaillierte Spezifikation siehe `Projektplan_Onlineshop_Container-Portal.md`.

## Geplanter Tech-Stack

| Schicht | Technologie |
|---------|------------|
| E-Commerce-Backend | Medusa.js v2 (TypeScript, MikroORM, PostgreSQL) |
| Kunden-Frontend | Next.js 15 + Tailwind CSS 4 + shadcn/ui + React Query + Recharts |
| Marketing-Website | Next.js (SSG), evtl. im gleichen Projekt |
| Datenbank | PostgreSQL 16 |
| Cache / Queue | Redis 7 |
| Datei-Storage | MinIO (S3-kompatibel, für Rechnungen/Lieferscheine/Wiegescheine) |
| ERP-Sync | Custom Node.js Service (SFTP + XML/CSV) |
| Reverse Proxy | Traefik 3 (SSL via Let's Encrypt) |
| Hosting | Hetzner Cloud (DE), Docker Compose |
| CI/CD | GitHub Actions |
| Monitoring | Grafana + Prometheus |

## Architektur-Überblick

Zwei Nutzergruppen: **Betreiber** (Admin via Medusa Admin Dashboard) und **Gewerbekunden** (Next.js Storefront).

### Custom Medusa Modules (zu entwickeln)
- `delivery-locations` — Lieferort-Verwaltung pro B2B-Kunde mit PLZ-Validierung gegen Einzugsgebiete
- `documents` — Dokumenten-Center (Rechnungen, Lieferscheine, Wiegescheine) mit MinIO-Storage
- `statistics` — Kosten-/Mengenauswertung, Excel-Export (`exceljs`), CO2-Reporting mit PDF (`@react-pdf/renderer`)
- `gewabfv` — GewAbfV-Dokumentation (Gewerbeabfallverordnung) mit Trennungsbegründungen

### Kern-Workflow: Auftragsbestellung
Medusa v2 Workflow Engine mit Compensation (Rollback):
1. `validateDeliveryLocation` → 2. `validateAvailability` → 3. `calculatePrice` (kundenindividuell) → 4. `createOrder` → 5. `sendConfirmationEmail` → 6. `syncToERP`

### Auftrags-Status-Flow
`Erstellt → Bestätigt → Disponiert → In Ausführung → Abgeschlossen → Dokumentiert`

### Kundenrollen
Firmen-Admin, Besteller, Nur-Lesen, Baustellen-Manager — mit abgestuften Berechtigungen auf Aufträge, Dokumente, Kosten und Nutzerverwaltung.

## Konventionen

- Sprache im Code: Englisch (Variablen, Kommentare, Commits)
- Sprache in der UI: Deutsch
- Commit-Messages: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)
- Alle Services laufen als Docker-Container
- DSGVO-Konformität beachten: Hosting in DE, keine externen Tracker, selbst gehostete Analytics
