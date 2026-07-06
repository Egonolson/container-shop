# ADR 0001: Supabase self-hosted als Backend für den Portal-Ausbau

**Status:** Angenommen — Architektur-Entscheidung freigegeben durch Sebastian am 2026-07-03. Deployment auf DEV folgt erst nach der Orphan-Prüfung (siehe Freigabe-Status unten).
**Datum:** 2026-07-03
**Bezug:** [Release-Plan Portal-/ERP-Ausbau](../plans/2026-07-03-release-plan-portal-erp-ausbau.md), Kapitel 2 (Architektur-Zielbild) und Kapitel 3, R0

## Kontext

Der Seyfarth-Shop läuft heute als reine Next.js-Anfragestrecke ohne Datenbank und ohne Auth — Anfragen werden serverseitig als JSONL im Docker-Volume abgelegt (`storefront/src/app/api/shop-requests/route.ts`). Der geplante Portal-Ausbau (Kundenkonten, ERP-Spiegel, Preiskalkulation, Baustellen, Rechnungen, Geo-/Foto-Daten) braucht erstmals:

- Authentifizierung (Registrierung, Login, Sitzungsverwaltung) für Privat- und Gewerbekunden
- Relationale Datenhaltung mit Zugriffskontrolle pro Kunde/Firma (Row Level Security)
- Datei-Speicher für Stellplatzfotos und GewAbfV-Nachweise
- Serverseitige Funktionen für den ERP-Sync-Worker (CoTraS-Schnittstelle von Computer Service Hess)

## Entscheidung (Vorschlag)

**Supabase self-hosted** (Postgres, GoTrue, PostgREST, Storage, Kong, Edge Functions) als zusätzliche Services im bestehenden `docker-compose.seyfarth.yml`, betrieben auf demselben Hetzner-Server-Modell wie die aktuelle Runtime (DEV auf `hetzner-claw`, PROD auf `hetzner-prod`).

**Single-Port-Integration:** Der bestehende `seyfarth-nginx` (Port 8092) proxyt `/auth`, `/rest`, `/storage`, `/functions` same-origin zu Kong — kein neuer öffentlicher Port, CSP bleibt bei `connect-src 'self'`. DB/Studio/Kong-Admin bleiben ausschließlich intern/loopback erreichbar.

## Begründung

- **DSGVO/Hosting-DE-Auflage** (Projekt-Konvention: "Hosting in DE, keine externen Tracker") schließt Managed-Cloud-Alternativen mit US-Anbietern aus; ein self-hosted Stack auf dem bestehenden Hetzner-Server bleibt vollständig unter eigener Kontrolle.
- **Bewährter VXD-Standardstack**: Mehrere andere VXD-Projekte laufen bereits auf self-hosted Supabase (siehe `01-Skills/supabase-self-hosted-docker`); Betriebswissen (Image-Versionen, RLS-Fallstricke, GoTrue-Startup) ist im Vault dokumentiert und wiederverwendbar.
- **Eigenbau wäre teurer**: Eine eigene Auth-/Rollen-/RLS-Lösung (z. B. Node + eigenes JWT-Handling) müsste Sicherheits- und Betriebsreife erst aufbauen, die Supabase bereits mitbringt.
- **Kein Bruch mit dem Bestand**: Next.js bleibt die einzige Frontend-App; der anonyme Gast-Flow (`POST /api/shop-requests`) bleibt unverändert produktiv und wird zusätzlich in die Datenbank persistiert (JSONL bleibt als Append-only-Audit erhalten).

## Konsequenzen

- Neue Betriebskomplexität: von einer statischen Site + JSONL auf einen Mehr-Service-Stack mit echten Kundendaten — Backup/Restore, Monitoring und ein Security-Review sind vor dem ersten echten Kundenkonto zwingend (siehe Release-Plan, Risiko #4).
- Der bestehende `seyfarth-postgres`-Orphan auf `hetzner-prod` (Altlast aus dem entfernten Medusa-Stack) muss vor dem Aufsetzen des neuen Stacks read-only auf Daten-/Rollback-Relevanz geprüft werden.
- RLS ist für jede neue Tabelle Pflicht (Projekt- und VXD-Coding-Standard); `getUser()`-Prüfung vor jeder Mutation.

## Was diese ADR NICHT entscheidet

- Ob die PLZ-Zonen-Preismatrix im ERP oder shopseitig gepflegt wird (offene Frage an Hess, siehe API-Anforderungskatalog).
- Den Kartendienst (OSM/Leaflet vs. Google Maps) — separate Kundenentscheidung.
- Das tatsächliche Deployment auf `hetzner-claw` — das folgt erst nach Freigabe dieser ADR als eigener R0-Arbeitsschritt.

## Freigabe-Status

- [x] Sebastian hat diese ADR gegengelesen und freigegeben (2026-07-03, "passt so")
- [ ] `seyfarth-postgres`-Orphan-Prüfung auf `hetzner-prod` ist erledigt — braucht Server-Zugriff, noch offen
- [ ] Erst nach beidem: tatsächliches Deployment des Supabase-Stacks auf DEV
