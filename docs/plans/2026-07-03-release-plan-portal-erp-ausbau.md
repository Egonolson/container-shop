# Release-Plan Seyfarth-Onlineshop — Ausbau zum Kundenportal mit ERP-Anbindung

**Projekt:** Containerdienst Seyfarth — Shop-Ausbau (Kundenkonten, CoTraS-Integration, Portal)
**Stand:** 2026-07-03 · **Autor:** Vision X Digital (Lead PO) · **projekt_status:** prod (Shop live seit 2026-05-11)
**Basis:** Next.js-16-Anfragestrecke ohne Backend/DB/Auth (JSONL-Ablage), PROD auf hetzner-prod:8092, DEV auf hetzner-claw

> **Update 2026-07-03 (nach Meeting Sebastian × Computer Service Hess × Christoph Seyfarth):** Computer Service Hess entwickelt die CoTraS-Schnittstellen als **REST-APIs mit JSON-Payloads**; CoTraS und Shop liegen beide in der Hoheit von Herrn Seyfarth. Spezifikation und Testzugang folgen. Bis dahin: API-Anforderungskatalog an Hess übergeben (siehe R0) und den ERP-unabhängigen Track (R0-Fundament + R1, siehe „Sofort startbar") umsetzen.

---

## 1. Executive Summary

Der heute live laufende Anfrage-Shop wird in sechs Release-Stufen zu einem Kundenportal mit Registrierung (privat/gewerblich), ERP-Anbindung (CoTraS), Preiskalkulationen, Baustellenverwaltung, Rechnungsanzeige und Geo-/Foto-gestützter Terminvereinbarung ausgebaut. Technisches Fundament ist Supabase self-hosted (Postgres/RLS, GoTrue, Storage, Edge Functions) als Single-Port-Erweiterung hinter dem bestehenden seyfarth-nginx auf Port 8092 — der erprobte VXD-Standardstack mit >15 produktiven Instanzen. Der kritische Pfad ist die **CoTraS-Schnittstelle**: Sie wird von Computer Service Hess als REST-API (JSON) entwickelt (Meeting 2026-07-03; Hoheit bei Herrn Seyfarth) — Spezifikation und Testzugang stehen noch aus. Deshalb geht in R0 als Erstes ein API-Anforderungskatalog an Hess, gefolgt von Spezifikations-Review und verifizierendem Read-Smoke als Go/No-Go-Gate, bevor ERP-abhängige Features (F2, F3, F4, F6, F7) fest zugesagt werden. Der bestehende Gast-Flow bleibt in allen Stufen regressionsfrei erhalten; ab R3 können Privatkunden gemäß Kundenanforderung auch **als Gast verbindlich bestellen** — ohne Portal-Funktionen und ohne ERP-Preiskalkulation, die registrierten Konten vorbehalten bleibt. Die verbindliche Geschäftsregel „kein Online-Festpreis bei tonnageabhängiger Entsorgung" bleibt dauerhaft unangetastet; Preise kommen ausschließlich lesend und versioniert aus dem ERP. Jedes Release liefert Seyfarth demonstrierbaren Wert (R1: Konten, R2: automatischer Katalog + Bestandskunden-Erkennung, R3: Self-Service-Kalkulation, R4: Baustellen + GewAbfV, R5: Rechnungen + Karte/Foto). Gesamtrahmen: ca. **24–31 Wochen** (~6–8 Monate) unter der Annahme von zwei parallelen Entwicklungssträngen in R2; bei Einzelbesetzung eher 30–40 Wochen — jeweils zzgl. externer Wartezeiten (ERP-Anbieter, Domain-/Jura-Entscheidungen). Gemischte Gewerbeabfälle bleiben bis zum GewAbfV-Paket (R4) hart auf Anfrage-only, damit der neue Bestellkanal zu keinem Zeitpunkt gegen die seit 07/2026 geltende Foto-Dokumentationspflicht verstößt.

---

## 2. Architektur-Zielbild

**Backend-Entscheidung (ADR in R0 zu bestätigen, Freigabe Sebastian):** Supabase self-hosted auf Hetzner DE (postgres 15, GoTrue, PostgREST, Storage, Edge Functions, Kong) als zusätzliche Services im bestehenden `docker-compose.seyfarth.yml`. Begründung: Hosting-DE-/AVV-Auflage schließt Managed Cloud aus; Eigenbau (Node/Prisma + Auth-Framework) kostet 2–3× ohne Betriebsnachweis; Keycloak deckt nur Auth ab. Skill `supabase-self-hosted-docker` liefert die getestete Image-Kombination.

**Single-Port-Integration:** seyfarth-nginx (8092) proxyt `/auth`, `/rest`, `/storage`, `/functions` same-origin zu Kong — **kein neuer öffentlicher Port**, CSP bleibt bei `connect-src 'self'`. DB/Studio/Kong-Admin/GoTrue-Admin (9999) nur 127.0.0.1 bzw. containerintern. Die Nginx-404-Blöcke für Portal-Pfade (`/login`, `/registrieren`, `/konto`, `/admin`, …) werden gezielt geöffnet.

**ERP-Integrationsschicht:** Ein gemeinsames Sync-Gerüst (Adapter-Interface, idempotente Upserts per externer ID + Hash-Diff, `sync_runs`/`sync_errors`, Retry mit Backoff, Sync-Monitor im Admin) trägt alle vier ERP-Datenströme: Kundenstamm (F2), Katalog/Preise (F3), Baustellen (F6), Rechnungen (F7). Start strikt **Pull-only, lesend**; Write-back (Baustellen Portal→ERP) erst nach stabiler Lesestrecke. Die frühere Kundenidee „direkter CoTraS-DB-Zugriff" ist vom Tisch — Hess liefert REST-APIs mit JSON (Meeting 2026-07-03); der Shop hält trotzdem einen entkoppelten Spiegel (kein Live-Durchgriff zur Laufzeit — ein ERP-Ausfall darf den Shop nicht treffen). Bewusst kein n8n für preis-/kundenkritische Sync-Pfade (TDD-/Versionierbarkeits-Pflicht).

**Geo-/Adressdienst (eine Entscheidung für F2 + F5, dedupliziert):** VXD-Empfehlung ist Leaflet/OSM self-hosted — Photon (Autocomplete) + Nominatim-Deutschland-Extract (Verifikation) als interne Docker-Services, serverseitig geproxyt, plus gemeinsame `geocode_cache`-Tabelle und wiederverwendete Kartenkomponente (F5, F6). **Achtung, aktive Abweichung von der Kundenformulierung:** Seyfarth hat explizit „Google Maps" genannt; die OSM-Empfehlung (einwilligungsfrei, kostenfrei, CSP bleibt `'self'`) wird dem Kunden mit Side-by-Side-Demo auf DEV aktiv zur Entscheidung vorgelegt (Frage 9). Besteht Seyfarth auf Google Maps, sind Zwei-Klick-Consent, CSP-Öffnung und SCC-Prüfung einzuplanen (datenschutzrecht-Skill, +1–2 Wochen).

**Was vom Bestand bleibt:** Next.js-16-Storefront als einzige Frontend-App; der anonyme Gast-Flow (`POST /api/shop-requests`) unverändert produktiv, künftig zusätzlich in die DB persistiert (JSONL bleibt Append-only-Audit); Validierungsmuster (Katalog-Re-Validierung, Honeypot, Form-Version-Pinning) und die Zonen-/Preislogik werden serverseitig weiterverwendet. `seyfarth-shop-data.ts` wandelt sich von Datenquelle zur Typ-Definition — Inhalte kommen ab R2 aus der DB (Migration der 13 wasteItems + 6 materialItems als aktive Startdaten, Ausbau `zone_locations` von 11 auf 258 PLZ-Einträge).

---

## 3. Releases

### R0 — Fundament, Entscheidungen & Entriskung (MUST) · ~4–6 Wochen

**Sprint-Goal:** Alle Blocker-Entscheidungen sind gefallen, der kritische Pfad (CoTraS) ist per Smoke verifiziert oder als No-Go erkannt, der Supabase-Stack läuft auf DEV.

Inhalte (aus Querschnittspaket):
- **API-Anforderungskatalog an Computer Service Hess als allererstes Arbeitspaket** (liegt vor: `docs/plans/2026-07-03-cotras-api-anforderungskatalog.md`): Entitäten (Kunden, Artikel/Preise/Containertypen, Baustellen, Rechnungen, Aufträge/Wiegedaten), Feldlisten, Delta-Sync, Auth, Testsystem — damit Hess die REST-Schnittstellen von Anfang an passend zum Shop-Bedarf baut. Danach Spezifikations-Review mit Hess und **Read-Smoke gegen das Testsystem mit Go/No-Go** (Schlotte-Lehre: dokumentierte Endpoints können 500 liefern). Ergebnis kalibriert die Aufwände von F2/F3/F4/F6/F7.
- **Plan B (Restrisiko-Pfad):** Seit der Hess-Zusage (REST/JSON) deutlich unwahrscheinlicher, bleibt aber definiert: Verzögert sich die Schnittstelle wesentlich oder fällt der Smoke durch, überbrückt eine CSV-/SFTP-Export-Variante mit reduziertem Scope (Katalog + Kundenstamm periodisch, keine Rechnungen on-demand, Baustellen portal-geführt); parallel wird der ERP-unabhängige Track vorgezogen (R1, Sync-Gerüst mit Mock-Adapter, F5). Die R0-Pakete laufen parallel — den Abschluss takten die externen Zulieferungen (Hess-Spezifikation, Jurist, Domain), nicht die interne Arbeit.
- Architektur-ADR Supabase self-hosted (Freigabe Sebastian); **seyfarth-postgres-Orphan auf hetzner-prod read-only prüfen** (Daten-/Rollback-Relevanz), bevor der neue Stack deployt wird.
- Supabase-Stack auf DEV (hetzner-claw) inkl. Grundschema (~17 Tabellen, RLS + service_role-GRANT je Tabelle, Migrationstooling), Nginx-Umbau (404-Blöcke, Proxy-Routen, Rate-Limit-Zonen), Backup-/Restore-Konzept mit **Restore-Probe als DoD**.
- Entscheidungen bündeln: finale Webshop-Domain (Kundenabsprache 08.06.: eigene Domain), EU-SMTP-Provider + SPF/DKIM/DMARC (SpamCop-Historie!), Kartendienst (OSM-Default vs. Google, eine Entscheidung für F2+F5).
- DSGVO-Rahmen: Verarbeitungsverzeichnis-Einträge, Rechtsgrundlagen, AVV-Prüfungen (Hetzner, SMTP, ERP-Anbieter), Löschfristen-Katalog, Datenschutzerklärungs-Entwurf zur juristischen Freigabe.
- Technische Schulden vor dem Ausbau: Test-Runner + CI etablieren (zwei Testdateien ohne test-Script; TDD-Pflicht des Agentic-Coding-Gates), roten Produktdaten-Test in `seyfarth-shop-data.test.ts` grün ziehen, **DEV/PROD-Drift-Gate** (Mobile-Wizard, Navigation, Hilfeseiten) sauber ziehen, damit R1 nicht auf zwei divergierenden Ständen entwickelt wird; Agentic-Coding-Hooks im Repo installieren.

**Abhängigkeiten:** Seyfarth stellt CoTraS-Kontakt her; Sebastian-Freigaben (ADR, Orphan); DNS-Hoheit für Mail-Setup.
**Demo-/Abnahmekriterium:** Smoke-Protokoll CoTraS (Go/No-Go dokumentiert); Supabase-Stack auf DEV mit RLS-Grundschema; Restore-Test bestanden; Testmail besteht Zustellbarkeits-Smoke inkl. Blocklist-Check; ADRs + Entscheidungsdokumente liegen vor; CI läuft grün.

---

### R1 — Registrierung & Kundenkonten mit Gast-Weiche (Feature 1, MUST, L) · ~3–4 Wochen

**Sprint-Goal:** Privat- und Gewerbekunden können Konten anlegen und sich sicher einloggen; der PROD-live-Gast-Flow bleibt regressionfrei.

Inhalte: Kontomodell `private|business` (GoTrue + `customers`-Profil mit vorbereitetem `erp_customer_id`-Anker und sauberen Matching-Feldern für R2), Double-Opt-In-Verifikation, Login/Logout/Passwort-Reset, Cookie-Session + Middleware-Guard, Gast-vs-Konto-Weiche im Kontakt-Schritt (ohne Verlust des Konfigurator-Stands, inkl. Schritt-Komponenten-Refactoring des 510-Zeilen-Monolithen mit Tests), Vorbefüllung, Anfragen-Verknüpfung (`customer_id`, Gast = null), Konto-Bereich `/konto` (Profil, Anfragenliste, Konto-Löschung nach Art. 17), Form-Version `seyfarth-inquiry-v2` mit serverseitiger Abwärtskompatibilität, deutsche GoTrue-Mail-Templates. Dazu **Admin-Backoffice-Grundgerüst** unter `/admin` (Admin-Auth, Rollen `seyfarth_staff`/`vxd_admin`, Anfragen-Inbox mit Statuspflege + Gast/Konto-Kennzeichnung, Migration der Bestands-JSONL mit Abgleichszählung, `admin_audit_log`).

**Abhängigkeiten:** aus R0 nur Stack, SMTP, Domain und Nginx-Umbau — **nicht** der CoTraS-Smoke; R1 kann deshalb parallel zur laufenden ERP-Klärung starten, falls diese sich zieht. **Wichtig (Erwartungsmanagement):** Bestandskunden-Erkennung „bei Registrierung" kommt erst mit R2; alle bis dahin registrierten Konten werden dort per Retro-Matching-Lauf nachgezogen — im Release-Reporting an Seyfarth explizit so kommunizieren.
**Demo-/Abnahmekriterium:** Registrierung inkl. E-Mail-Verifikation Ende-zu-Ende auf DEV und (nach GELB-Freigabe) PROD; Gast-Anfrage unverändert nutzbar (Browser-Smoke Gast + Konto); Anfrage eines eingeloggten Kunden erscheint im Konto; Security-Review (RLS, Auth-Endpunkte, Rate-Limits) dokumentiert; A11y-Check der neuen Formulare (BFSG).

---

### R2 — ERP-Sync-Welle 1: Katalog + Bestandskunden-Abgleich + Adressverifikation (Features 3 + 2, beide MUST, je L) · ~5–6 Wochen bei zwei parallelen Entwicklungssträngen, 8–10 Wochen bei Einzelbesetzung (zwei Tracks auf gemeinsamem Sync-Gerüst)

**Sprint-Goal:** Stammdaten fließen automatisiert und auditierbar aus CoTraS; Bestandskunden werden sicher ihrem ERP-Konto zugeordnet.

**Track A — Katalog-Sync (F3):** `erp_articles` (read-only-Spiegel) strikt getrennt von `catalog_items` (Anreicherung); Statusmodell `imported → in_enrichment → ready_for_review → active → archived` mit **ausschließlich manueller Aktivschaltung** (Pflichtfeld-Gate: kein Aktivieren ohne Bild + Beschreibung); Delta-Sync per Hash + nächtlicher Voll-Abgleich, Quarantäne für invalide Artikel, Soft-Handling gelöschter ERP-Artikel (`deleted_in_erp_at`, Auto-Archivierung + Alert, nie Hard-Delete); `price_history` + `price_list_versions` je preisrelevantem Lauf (Pflicht aus Preismodell-Doku); **Containertypen/-größen als eigene Sync-Entität `container_types`** (die Anforderung nennt Materialien UND Containertypen mit Preisen und Größen — nicht nur Artikel); Admin-Module Sync-Dashboard + Anreicherungs-Editor (Bild-Upload via Storage-RLS, Body-Limit-Anpassung) + **Regel-Pflege-UI `waste_item_rules`** (Gefahrstoffkennzeichen, Pflicht-Hinweistexte, Verpackungsvorgaben wie Big-Bag, Pflichtbestätigungen, Bearbeitungsgebühren und erlaubte Containergrößen je Abfallart — verbindliche Produktentscheidung vom 2026-05-11: im Backend einstellbar, nicht hardcoded); Storefront-Umstellung auf DB-Katalog (`public_catalog`-View, nur `active`) inkl. Migration der Bestandsdaten und der 258-PLZ-Zonentabelle; ab hier wird auch im **Gast-Flow** der Preis-Snapshot inkl. `price_list_version_id` pro Anfrage persistiert (Pflicht aus dem Preismodell — heute nimmt der Server den pricing-Block nur entgegen, ohne ihn zu speichern); Alerting bei ausbleibenden Läufen (kein stiller Stale-Preis-Zustand).

**Track B — Bestandskunden-Match + Adressverifikation (F2):** Kundenstamm-Spiegel `erp_customers` (RLS: nur service_role/Admin, nie Endkunden); Matching-Engine serverseitig **nach** E-Mail-Verifikation über die vier vereinbarten Matchfelder **E-Mail, Vor-/Zuname, Adresse (normalisiert über die Adressverifikation) und USt-ID** (gewichteter Score; USt-ID-Treffer wiegt bei Gewerbekunden am höchsten) — Auto-Link ausschließlich bei exaktem Treffer der verifizierten E-Mail mit eindeutigem Kandidaten, alle anderen Fälle in die **manuelle Freigabe-Queue** (Feldvergleich, Score, Audit-Trail; Konto bis zur Entscheidung als Neukunde voll nutzbar); **Retro-Matching-Lauf** für alle seit R1 registrierten Bestandskonten als eigenes Arbeitspaket; Enumeration-Schutz (identische Responses, Match-Ergebnis nie vor Freigabe sichtbar — ROT-Nähe Kundendaten); Adressverifikation via Photon/Nominatim-Proxy (`/api/address/suggest|verify`) als **Pflichtschritt** gemäß Kundenanforderung — eine nicht bestätigbare Adresse wird nicht still übernommen, sondern landet mit `address_verified=false` in der Prüf-Queue (der weichere Fallback „trotzdem verwenden" wäre eine Abweichung von der Anforderung und bräuchte Seyfarth-Freigabe, Frage 10); Benachrichtigung an Kunde bei Verknüpfung und an Seyfarth bei neuen Queue-Einträgen; Schwellen-Kalibrierung über einen **anonymisierten/pseudonymisierten** Probedatenexport (Kundendaten-Export ist ROT: Durchführung nur durch Menschen nach AVV-Klärung mit dem ERP-Anbieter, nie agentisch).

**Abhängigkeiten:** R0 (CoTraS-Smoke = Go), R1 (verifizierte Konten, Admin-Rahmen); Mapping-Input Seyfarth (Artikel ↔ Kategorien/AVV/Regeln); Anreicherungs-Kapazität bei Seyfarth benennen; Nominatim/Photon-Ressourcenprüfung auf claw/prod (Port-Doku-Pflicht).
**Demo-/Abnahmekriterium:** Neuer ERP-Artikel erscheint inaktiv, wird angereichert, aktiviert und im Konfigurator sichtbar; ERP-Preisänderung erzeugt neue Preislisten-Version; Bestandskunde mit ERP-E-Mail wird automatisch verknüpft, Grenzfall landet nachvollziehbar in der Queue; Mehrmandanten-/Enumeration-Tests grün; Sync-Dashboards zeigen Läufe/Fehler.

---

### R3 — Kalkulation & verbindliche Bestellung für registrierte Kunden (Feature 4, MUST, L) · ~4–5 Wochen

**Sprint-Goal:** Registrierte Kunden kalkulieren self-service mit echten ERP-Preisen; aus der Kalkulation wird regelbasiert Bestellung oder Anfrage — ohne jemals einen falschen Festpreis auszugeben.

Inhalte: **Serverseitige autoritative Preis-Engine** (Client sendet nie Preise — hartes Prinzip; heutige `getTransportPrice`/`lookupZone`-Logik auf DB-Quelle gespiegelt); Portal-Kalkulations-Flow als parametrisierter Konfigurator (Kontakt-Schritt entfällt, Live-Preis-Preview via React Query); Netto-primär (Gewerbe) / Brutto-primär (privat), Netto/USt/Brutto je Position getrennt persistiert; Regelwerk beim Absenden: alles bepreisbar → `order`; `requiresWeighing` → Bestellung mit fixem Transport + „voraussichtlich, Endabrechnung nach Verwiegung", `price_is_final=false` als **Systeminvariante**; Gefahrstoff / **gemischte Gewerbeabfälle (nicht-gefährliche AVV wie 17 09 04, 20 03 01 — hart `inquiry_only`, bis das GewAbfV-Paket aus R4 live ist; sonst entstünde ein Bestellkanal ohne die seit 07/2026 pflichtige Getrennthaltungs-/Foto-Dokumentation)** / unbekannte Zone (still, ohne Warnbanner — bestehende Entscheidung) / „Ich bin unsicher" → `inquiry`; Snapshot-Pflicht (Preislisten-Version, Einzelpreise, Zone, AVV, Stellplatz, Form-Version `seyfarth-portal-calc-v1`); Statusfluss aus dem Modulkatalog (Erstellt→…→Dokumentiert) inkl. Historie; Zahlungsarten Rechnung/Vor-Ort via `payment_method_settings` je Produkt/Kategorie einstellbar (verbindliche Produktentscheidung 2026-05-11); **Mollie-Onlinezahlung für festpreisfähige Produkte im Datenmodell vorgesehen (`mollie_enabled`), Aktivierung bewusst Phase 2 — als Scope-Entscheidung mit Seyfarth zu bestätigen (Frage 12), nicht stillschweigend gestrichen;** „Meine Kalkulationen/Aufträge" mit Duplizieren; Bestell-/Anfrage-Bestätigungsmails; Stale-Preis-Politik (Vorschlag: Kennzeichnung ab Sync-Alter, Bestell-Block >72 h — mit Seyfarth zu bestätigen). **Gastbestellung (Kundenanforderung 1):** Das Bestell-Regelwerk gilt auch für nicht registrierte Privatkunden — Gäste können verbindlich bestellen (Zahlung vor Ort/nach Verwiegung), sehen aber keine ERP-Preiskalkulation und haben keine Portal-Funktionen (keine Historie, keine Baustellen, keine Rechnungen); Zuschnitt mit Seyfarth final abstimmen (Frage 12).

**Abhängigkeiten:** R1 (Auth), R2 Track A (Preisquelle + 258-PLZ-Tabelle) — **hart**; AGB-/Fernabsatz-Klärung (Widerruf Privatkunden bei Bestellung mit offener Verwertung) — juristisch **vor** Go-Live; USt-Satz-Klärung (Steuerberater).
**Demo-/Abnahmekriterium:** Gewerbekunde kalkuliert Container + Entsorgung mit klar getrenntem Fix-/Schätzanteil und gibt verbindlich auf; Gefahrstoff-Position mündet automatisch in Anfrage; Manipulationstest (Client-Preise werden serverseitig ignoriert) bestanden; Bestätigungsmail mit Referenznummer und Preisaufstellung zugestellt.

---

### R4 — B2B-Paket: Baustellenverwaltung + GewAbfV-Compliance (Feature 6 SHOULD/L + Compliance-Paket MUST/gesetzlich) · ~4–5 Wochen

**Sprint-Goal:** Gewerbekunden arbeiten mit ihren realen Baustellen; die seit 07/2026 geltende GewAbfV-Fotodokumentationspflicht ist digital abgebildet.

**Baustellen (F6):** `construction_sites` mit klarer Feldhoheit (ERP-geführt: Name/Adresse/ID; portal-geführt: Geo-Pin, Hinweise, Ansprechpartner); Initial-Import beim ERP-Match (R2) + Delta-Sync; Rücksync Portal→ERP asynchron (`pending_erp` → `synced`, ERP-ID zurück; **Fallback bei fehlender Schreib-API:** Baustellen bleiben portal-geführt, Übergabe nur am Auftrag — im Datenmodell vorgesehen, dann schrumpft F6 auf M); Baustellen-Auswahl ersetzt den Ort-Schritt für eingeloggte Gewerbekunden (Zone automatisch, außerhalb der 3 Zonen → stiller Anfrage-Modus); Dubletten-Warnung; Mehrbenutzer-Basis `companies`/`company_users` mit Rollen Admin/Besteller, E-Mail-Einladung, Deaktivierung (Session-Invalidierung prüfen, mind. 1 aktiver Admin erzwungen), RLS auf Firmenebene mit Testusern je Rolle; Baustellen-Manager-/Nur-Lesen-Rollen nur als Schema-Erweiterungspunkt (Phase 2).

**GewAbfV-Compliance (vom Kunden nicht explizit genannt, gesetzlich zwingend — Novelle-Stichtag 07/2026 ist erreicht):** Getrennthaltungs-Erklärung im Checkout bei gemischten Gewerbeabfällen (pro Auftrag/Kunde/Lieferort/AVV/Jahr, PDF-fähig), **Foto-Upload als Pflichtnachweis der Nicht-Trennbarkeit** mit AUFBEWAHRUNGspflicht — strikt getrennt von den 3-Monats-Lösch-Stellplatzfotos aus R5 (eigener Bucket, eigene Regeln); AVV-geführte Auswahl (WasteCode-Modell mit 15 Seed-AVV liegt vor); Erzeugernummer + eANV-Vollmacht-Upload bei gefährlichen Abfällen, TRGS-519-Nachweis mit Ablaufdatum und Admin-Prüfung (Bestellung blockiert bis Nachweis vorliegt); qualifizierte E-Signatur bewusst später. Die hier gebaute Upload-Pipeline (Magic-Byte, sharp-Re-Encoding + EXIF-Strip, ClamAV, private Buckets, signierte URLs) ist der Querschnitts-Baustein, den R5 wiederverwendet. **Interim bis R4-Go-Live:** GewAbfV-Nachweise laufen im bestehenden manuellen Prozess bei Seyfarth — mit Kunde als Übergangsregelung festhalten.

**Abhängigkeiten:** R2 (ERP-Link, Adressdienst), R3 (Bestellflow als Einhängepunkt); CoTraS-Baustellen-Objekt-Klärung (Go/No-Go für Voll-Sync vs. Fallback); Abfallrechts-Input für Erklärungstexte.
**Demo-/Abnahmekriterium:** Gewerbekunde sieht ERP-Baustellen, bestellt in <1 Minute für eine davon, legt eine neue an, die im ERP ankommt (oder Fallback demonstriert); zweiter Firmen-User per Einladung aktiv; RLS-Test: Firma A sieht nie Baustellen der Firma B; GewAbfV-Erklärung mit Foto-Pflichtnachweis wird erzeugt und als PDF für Behördenkontrolle ausgegeben.

---

### R5 — Dokumente & Termin-Komfort: Rechnungen + Geo-Pin/Stellplatzfotos (Features 7 SHOULD/M + 5 SHOULD/L) · ~4–5 Wochen

**Sprint-Goal:** Das Portal wird zur Anlaufstelle für Abrechnungen und liefert der Disposition metergenaue Stellplatzdaten.

**Rechnungen (F7):** `/portal/rechnungen` mit Metadaten-Sync (15–60 Min, Upsert per ERP-Rechnungs-ID) und **hybridem PDF-Abruf** (on-demand vom ERP, dann Cache im privaten Bucket, Auslieferung nur über ~60-s-signierte URLs — das Referenzmuster `eptBelegdokument` stammt aus dem Sage-Projekt Schlotte und ist auf CoTraS **nicht übertragbar verifiziert**; die M-Schätzung ist erst nach dem R0-Smoke belastbar); RLS + doppelter Ownership-Check in der Edge Function; Zahlstatus nur hinter Feature-Flag (graceful degradation bei schlechter Pflege); `invoice_access_log` (Audit); PDF-Cache-TTL 90 Tage nach letztem Zugriff, Sichtbarkeit ~24 Monate (mit Seyfarth abzustimmen); klare Kommunikation: **ERP bleibt das revisionssichere Archiv (GoBD/§14b UStG)**, das Portal ist Anzeige-Schicht. Baustellen-Filter nur, falls ERP den Bezug strukturiert liefert. Optionale E-Rechnungs-Erweiterung (ZUGFeRD/XRechnung) vorgedacht — bei Bedarf eigene Mustang-Instanz statt Token-Mitnutzung (Blast-Radius popupmarkt/berliner14).

**Geo-Pin + Stellplatzfotos (F5):** Leaflet-Karte im Stellplatz-Schritt (self-hosted Tiles, Regionsextrakt für die 258-PLZ-Zonen, same-origin, CSP bleibt 'self'; Google nur bei dokumentierter Kundenentscheidung mit Zwei-Klick-Consent); Pin setzen/verschieben, GPS-Übernahme, Distanz-Plausibilitätsprüfung gegen Lieferadresse; max. 3 Fotos à 10 MB über die R4-Upload-Pipeline in eigenem Bucket `site-photos`, Gast-Upload per anfragegebundenem Token; **automatischer Löschjob: Auftragsabschluss + 90 Tage Karenz** mit Löschprotokoll (`photo_deletion_log`) + Fallback-TTL für nie abgeschlossene Anfragen + manuelle Art.-17-Löschung im Backoffice; Koordinaten (nicht Fotos) im Auftragspayload an die Disposition/ERP (notfalls Bemerkungsfeld); Wiederverwendung der Kartenkomponente für Baustellen-Geo-Pins (F6).

**Warum F5 erst hier — und wann früher:** Geo-Pin + Foto braucht fachlich nur die Upload-Pipeline aus R4 und keinerlei ERP; es steht am Ende, weil Konten → Preise → Bestellung die Umsatzstrecke bilden. Verzögert sich die CoTraS-Klärung, wird F5 als Puffer-Feature **vorgezogen** (der Karten-Pin allein nützt auch dem heutigen Gast-Flow). **Wiegedaten/Endabrechnung (empfohlene Ergänzung):** Bestellungen mit „Endabrechnung nach Verwiegung" (R3) werden erst rund, wenn der Kunde Wiegeschein und Endpreis später im Portal sieht — als Erweiterung des Rechnungsmoduls vorgesehen, sobald das ERP Wiegedaten liefert (Frage 6).

**Abhängigkeiten:** F7: R2 (Kundenmatch — ohne verlässliche Zuordnung wird keine Rechnung angezeigt), ERP-Belegabruf-Smoke; F5: R4-Upload-Pipeline, ERP-Statussignal „Abgeschlossen" als Löschfrist-Trigger (bis dahin manueller Abschluss-Status im Backoffice als Fallback).
**Demo-/Abnahmekriterium:** Kunde sieht seine Rechnungsliste und lädt ein PDF (Mehrmandanten-Test: nie fremde Rechnungen); ERP-Ausfall zeigt verständliche Meldung mit Retry; Kunde setzt Pin + lädt Foto hoch, Disposition sieht beides im Backoffice; Löschjob-Probelauf erzeugt protokollierte Löschung.

---

## 4. Abhängigkeitsübersicht

```
R0 Fundament ─┬─ Hess-Spezifikation+Smoke ─► blockiert R2, R3, R4, R5 (F7) — NICHT R1
              ├─ Supabase-Stack/ADR ────► blockiert R1 (und alles danach)
              ├─ SMTP/Domain ───────────► blockiert R1 (Verifikationsmails)
              └─ Kartendienst-Entscheid ► blockiert F2-Adressverif. (R2) + F5 (R5)

R1 Konten (F1) ────────────────────────► blockiert R2-Track-B, R3, R4, R5 (alles Portal)
R2 Track A Katalog/Preise (F3) ────────► blockiert R3 (einzige Preisquelle)
R2 Track B ERP-Match (F2) ─────────────► blockiert R4 (Baustellen-Import), R5 (F7 Rechnungszuordnung)
R3 Bestellflow (F4) ───────────────────► blockiert R4 (Baustellen-Auswahl im Flow, GewAbfV im Checkout)
R4 Upload-Pipeline ────────────────────► wiederverwendet in R5 (F5 Fotos)
ERP-Statussync „Abgeschlossen" ────────► Trigger Foto-Löschfrist (R5); Fallback: manueller Backoffice-Status
DEV/PROD-Drift-Gate + roter Test ──────► vor R1-Entwicklungsstart ziehen (R0)
Juristik (AGB/Fernabsatz, DSE) ────────► blockiert R3-Go-Live bzw. jedes PROD-Gate
```

Nicht blockierend: R1 hängt nicht am CoTraS-Smoke und kann parallel zur ERP-Klärung starten; F5 und F7 sind untereinander unabhängig — F5 ist bei ERP-Verzug als Puffer-Feature vorziehbar (braucht nur die R4-Upload-Pipeline); F6 funktioniert mit Fallback auch ohne ERP-Schreib-API; F4 funktioniert im Erstwurf ohne F6 (freie Adresseingabe).

### Sofort startbar, während Hess die Schnittstellen entwickelt (Stand 2026-07-03)

1. **API-Anforderungskatalog an Hess übergeben** — wichtigster externer Hebel: je früher Hess die Feldlisten/Delta-Anforderungen hat, desto geringer das Nacharbeits-Risiko.
2. **R0-Fundament komplett:** Supabase-Stack auf DEV, Nginx-Umbau, CI/Test-Runner + roten Produktdaten-Test grün ziehen, DEV/PROD-Drift-Gate, Backup/Restore mit Restore-Probe, SMTP-/Domain-Entscheidung + Zustellbarkeits-Setup, DSGVO-Rahmen.
3. **R1 vollständig** (Registrierung, Login, Konto-Bereich, Gast-Weiche, Admin-Backoffice-Grundgerüst, JSONL-Migration) — kein ERP-Bezug.
4. **Sync-Gerüst + Mock-CoTraS-Adapter:** Adapter-Interface, `sync_runs`/`sync_errors`, Idempotenz-Mechanik gegen Fixtures aus dem Anforderungskatalog entwickeln und testen; die echte Hess-API wird später nur als weiterer Adapter eingehängt.
5. **`erp_*`-Spiegeltabellen + Anreicherungs-Datenmodell** nach den Katalog-Feldlisten migrieren (bewusst mit Anpassungsreserve nach Hess-Spezifikation); Anreicherungs-Editor und Regel-Pflege-UI (`waste_item_rules`) gegen Mock-Daten bauen.
6. **OSM/Leaflet-Demo** (Adress-Autocomplete + Karten-Pin) auf DEV für die Kundenentscheidung Frage 9.
7. Bei längerem Verzug: **F5 vorziehen** (Karten-Pin + Foto-Upload nützt auch dem heutigen Gast-Flow).

---

## 5. Risiken Top-5

| # | Risiko | Auswirkung | Mitigation |
|---|--------|-----------|------------|
| 1 | **CoTraS-Schnittstelle in Fremdentwicklung:** Hess baut REST/JSON (zugesagt 2026-07-03), aber Spezifikation, Feldabdeckung, Delta-Fähigkeit, Testzugang und Zeitplan sind offen. Schlotte-Lehre: Endpoints liefern trotz Doku 500. | Kritischer Pfad; F2/F3/F4/F6/F7 verschieben sich um Wochen, wenn die gelieferte API Felder, Delta-Sync oder Belegabruf nicht hergibt. | Anforderungskatalog **vor** Hess-Entwicklungsstart übergeben + Spezifikations-Review; Read-Smoke mit Go/No-Go; Adapter-Pattern + Mock-Adapter, damit intern parallel weitergebaut wird; ERP-unabhängiger Track (R1) läuft parallel; keine Festzusagen an Seyfarth vor dem Smoke. |
| 2 | **Mailzustellbarkeit** (SpamCop-Vorfall aktenkundig): landet die Verifikationsmail im Spam, scheitert die Registrierung — und damit das gesamte Portal. | R1 faktisch tot, Vertrauensverlust bei Bestell-/Angebotsmails (R3). | Dedizierte Absender-Domain, EU-Transaktions-SMTP, SPF/DKIM/DMARC, Zustellbarkeits-Smoke inkl. Blocklist-Check als **Release-Gate** (nicht Nebenthema), Resend-Funktion. |
| 3 | **Falsch-Match / RLS-Fehler = Datenleck** (fremde Rechnungen, Baustellen, Konditionen sichtbar; faktischer Account-Takeover über Fehlfreigabe). Art.-33/34-Relevanz. | Datenschutzvorfall, ROT-Verstoß (Kundendaten-Preisgabe), Vertrauensschaden. | Auto-Match nur bei verifizierter-E-Mail-Exakt-Treffer, alles andere menschliche Freigabe-Queue mit Audit-Trail; RLS-Pflicht je Tabelle + Testuser je Rolle; doppelter Ownership-Check bei Dokumenten; Enumeration-Schutz; Security-Review als hartes PROD-Gate. |
| 4 | **Betriebskomplexitätssprung**: von statischer Site + JSONL auf 8+-Service-Stack mit Kundendaten — erste Datenbank im Projekt; Fehler bei Backup/Migration trifft alle Folge-Features. | Datenverlust, stille Ausfälle (Stale-Preise, hängende Syncs), DSGVO-Löschfristen laufen nicht an. | Restore-getestetes Backup als R0-DoD; Monitoring/Alerting (Healthchecks, Sync-/Mail-Fehler, Foto-Retention) vor erstem echtem Kundenkonto; JSONL bleibt Append-Audit; DB als führendes System definiert; Fallback-TTL + manueller Abschluss-Status für Löschfristen. |
| 5 | **Erwartungs- und Preis-Governance-Risiko**: Kunden lesen „voraussichtliche Verwertungskosten" als Festpreis; Seyfarth erwartet Bestandskunden-Erkennung schon in R1; jede Preisänderung außerhalb des ERP-Syncs ist ROT. | Reklamationen nach Verwiegung, „Feature wirkt unfertig", Governance-Verstoß. | Harte UI-Trennung fix/geschätzt + `price_is_final`-Invariante + Bestätigungs-Checkbox + AGB-Klausel; Release-Kommunikation an Seyfarth (dieser Plan); Preise ausschließlich lesend/versioniert aus dem ERP, Admin-UI read-only, serverseitige Preis-Engine als einzige Wahrheit. |

---

## 6. Offene Fragen (dedupliziert, gruppiert)

### An Computer Service Hess (entwickelt die CoTraS-REST-Schnittstellen; Hoheit bei Herrn Seyfarth) — die Fragen sind in den API-Anforderungskatalog `docs/plans/2026-07-03-cotras-api-anforderungskatalog.md` eingearbeitet
1. Welche Zugriffswege existieren (REST-API / DB-View / CSV-SFTP), mit Doku, Testsystem und Auth-Verfahren? Delta-Abfragen oder nur Vollexporte? *(blockiert: R0-Go/No-Go, damit R2–R5)*
2. Kundenstamm: eindeutige, stabile Kunden-IDs? E-Mail eindeutig pro Kunde? Mehrere Ansprechpartner? USt-ID gepflegt? Bekannte Dubletten? Anonymisierter Probedatenexport möglich? *(blockiert: R2 Track B)*
3. Artikel/Preise: stabile Artikelnummern (keine Wiederverwendung)? Löschkennzeichen? Netto/MwSt-Behandlung? Sind PLZ-/Zonen-Gestellungspreise im ERP oder bleiben sie shopseitige Preisliste? Gefahrstoff-/AVV-Felder vorhanden? *(blockiert: R2 Track A, R3)*
4. Baustellen: eigenständiges Lieferort-Objekt mit stabiler ID? Schreib-API mit ID-Rückgabe? Geo-Koordinaten-Felder? *(blockiert: R4 — entscheidet Voll-Sync vs. Fallback)*
5. Rechnungen: Metadaten-Endpoint je Kunde + Beleg-PDF on-demand (Base64/Binary) oder nur Export/SFTP? Zahlstatus geliefert? Baustellenbezug strukturiert? E-Rechnung (ZUGFeRD/XRechnung) vorhanden/geplant? *(blockiert: R5/F7)*
6. Aufträge: können Aufträge/Status per Schnittstelle angelegt bzw. zurückgemeldet werden (Portal→ERP), inkl. Statusereignis „Abgeschlossen" (Trigger Foto-Löschfrist)? Stornos/Wiedereröffnungen? Sind **Wiegedaten/Wiegescheine und Endabrechnungen** je Auftrag abrufbar (für die spätere Verwiegungs-Anzeige im Portal)? *(blockiert: R5/F5-Löschautomatik; beeinflusst R3-Statusanzeige und die Wiegedaten-Erweiterung)*

### An Seyfarth (Geschäftsführung / Fachbereich)
7. AVV-/Verantwortlichkeits-Klärung mit Computer Service Hess (Auftragsverarbeitung, Support-Zugriffe, Testdaten) — der Zugriffsweg selbst ist seit 2026-07-03 geklärt (REST/JSON durch Hess, Hoheit Seyfarth). *(blockiert: R0-Abschluss, nicht den Start)*
8. Finale Webshop-Domain + DNS-Hoheit; Freigabe EU-Transaktions-SMTP + Absenderadresse. *(blockiert: R1)*
9. Kartendienst — **aktive Abweichung von der Kundenformulierung „Google Maps":** genügt die einwilligungsfreie OSM/Leaflet-Lösung (VXD-Empfehlung, Side-by-Side-Demo auf DEV) oder ist Google Maps zwingend (dann Zwei-Klick-Consent, CSP-Öffnung + SCC, +1–2 Wochen)? Eine Entscheidung für Adressverifikation (R2) **und** Stellplatz-Karte (R5). *(blockiert: R2, R5)*
10. Registrierung: Gast-Anfrage weiterhin auch für Gewerbe (VXD-Empfehlung: ja)? USt-ID bei Gewerbe Pflicht oder optional (sie ist eines der vier Matchfelder)? Selbstauskunft „gewerblich" ausreichend? Nachträgliche Anfrage-Übernahme ins Konto gewünscht? Adressverifikation: harte Pflicht mit Prüf-Queue bei Nichtbestätigung (VXD-Default gemäß Anforderung) oder weicher Fallback „trotzdem verwenden"? *(blockiert: R1, R2)*
11. Prozess-Owner + SLA für die Match-Freigabe-Queue (Vorschlag 1 Arbeitstag); Neukunden-Übernahme ins ERP manuell (Empfehlung) oder automatisch? Optionales Kundennummern-Feld im Formular? *(blockiert: R2)*
12. Bestell-Politik: Zuschnitt der **Gastbestellung** für Privatkunden bestätigen (verbindlich bestellen ohne Konto, Zahlung vor Ort/nach Verwiegung, keine ERP-Preisanzeige — VXD-Auslegung der Anforderung 1)? Zahlarten je Kundentyp (VXD-Vorschlag: Gewerbe Rechnung+Vor-Ort, Privat Vor-Ort)? **Mollie-Onlinezahlung** für festpreisfähige Produkte in Phase 2 (Datenmodell vorbereitet) oder früher? Festpreisfähige Baustoffe trotz Startscope in Stufe 1 (VXD: ja)? Bindefrist/Stale-Preis-Politik (VXD: Snapshot 14 Tage; Bestell-Block >72 h Sync-Alter)? *(blockiert: R3)*
13. Juristisch (mit Rechts-/Steuerberatung): Verbindlichkeit einer Bestellung mit offener Verwertung + Widerruf/Fernabsatz Privatkunden; USt-Sätze je Position; finale Datenschutzerklärung. *(blockiert: R3-Go-Live, jedes PROD-Gate)*
14. Personal: benannte Admin-Nutzer (Anfragen, Freigaben, Produktpflege); wer leistet die Katalog-Anreicherung (Bilder/Texte), wie viele Artikel initial, bis wann? *(blockiert: R2-Abnahme)*
15. Löschfristen-Freigaben: unbestätigte Konten (VXD: 90 Tage), Gast-Anfragen, abgelehnte Match-Kandidaten, Foto-Fallback-TTL (VXD: 12 Monate), Rechnungs-Sichtbarkeit (VXD: 24 Monate, PDF-Cache 90 Tage); Bestätigung der Trennung Stellplatzfotos (Löschung) vs. GewAbfV-Fotos (Aufbewahrung); gelten Koordinaten als Auftragsbestandteil (VXD: ja, nur Bilder löschen)? *(blockiert: R4/R5, DSE-Finalisierung)*
16. Baustellen: Alt-Baustellen-Import wie weit zurück? Sicht-Einschränkung pro Mitarbeiter nötig (Baustellen-Manager-Rolle)? Korrekturen an ERP-Stammdaten über Backoffice (Empfehlung) oder Portal? Mehrere Kundennummern je Firma? *(blockiert: R4)*
17. Rechnungen: Historie-Tiefe, Gutschriften/Storni anzeigen (VXD: ja, gekennzeichnet), Fotos für Fahrer nur per Backoffice-Link (VXD-Empfehlung)? *(blockiert: R5)*

### Intern (VXD / Sebastian)
18. Formale Freigabe ADR „Supabase self-hosted" + Umgang mit dem seyfarth-postgres-Orphan auf hetzner-prod (read-only prüfen, sichern, dann entfernen oder ignorieren). *(blockiert: R0)*
19. Rollout-Reihenfolge DEV/PROD-Drift (Mobile-Wizard, Navigation) — frisches Mobile-Gesamt-Gate vor oder mit R1-PROD-Rollout. *(blockiert: R1-PROD-Gate)*

---

## 7. Zusätzlich empfohlene Themen (vom Kunden nicht genannt)

| Thema | Warum nötig | Verortung |
|---|---|---|
| **GewAbfV-Compliance-Paket** (Erklärungen, Foto-Pflichtnachweis, eANV/TRGS-519) | Gesetzliche Pflicht; Foto-Doku-Stichtag 07/2026 ist **erreicht**. Ohne digitale Abbildung ist der Gewerbe-Bestellflow rechtlich unvollständig. Interim: manueller Prozess bei Seyfarth. | R4 (MUST) |
| **Admin-Backoffice** | Ohne geschützte Oberfläche bleiben JSONL-Handauswertung, keine Katalog-Aktivschaltung, keine Match-Queue, kein Sync-Monitor. Träger von vier Pflicht-Modulen. | Rahmen R1, Module R2+ |
| **E-Mail-Fundament** (EU-SMTP, SPF/DKIM/DMARC, deutsche Templates, Benachrichtigungen an Seyfarth) | Verifikation, Bestellbestätigungen, Queue-/Sync-Alerts hängen daran; SpamCop-Vorfall macht Zustellbarkeit zum Gate. | R0/R1 |
| **DSGVO-Paket** (Verarbeitungsverzeichnis, Rechtsgrundlagen, AVVs, DSE, automatisierte Löschjobs, Betroffenenrechte-Prozess) | Erstmals Kundenkonten + Fotos + Geodaten + ERP-Spiegel: ohne Löschautomatik und juristisch freigegebene DSE kein rechtssicherer Betrieb. | R0, dann je Release fortgeschrieben |
| **Betrieb** (restore-getestete Backups, Monitoring/Alerting, deploy.sh-Erweiterung, Test-Runner + CI) | Sprung von statischer Site auf Stack mit Kundendaten; TDD-Pflicht braucht lauffähige Tests. | R0 (DoD) |
| **Security-Review als PROD-Gate** + CSP-Härtung (unsafe-inline/eval-Abbau) | Auth-/Dokumenten-/Upload-Pfade sind sicherheitskritisch; bestehende CSP-Altlast wird beim Nginx-Umbau mit abgebaut. | jedes Release |
| **BFSG/Barrierefreiheit** | B2C-Shop mit Kundenkonten fällt unter das BFSG (seit 28.06.2025); A11y-Grundregeln je Release, formales Audit + Barrierefreiheitserklärung vor Portal-Go-Live. | laufend, Audit vor R3-PROD |
| **Wiegedaten-/Endabrechnungs-Anzeige** | Logische Vervollständigung des „Endabrechnung nach Verwiegung"-Modells: Kunde sieht Wiegeschein und Endpreis im Portal statt nur die vorläufige Bestellung. Abhängig von ERP-Datenverfügbarkeit (Frage 6). | Backlog / R5+ |

---

## 8. Governance-Hinweise VXD

- **Agentic-Coding-Gate ist Pflicht** für den gesamten Ausbau (Auth-, Schnittstellen-, Abrechnungs-, Prod-Relevanz): Raw Spec → eigener Branch + Worktree → TDD (red/green) → unabhängiger Tester → PM-/Demo-Check → PR-Review → **Human Accept** vor Merge/Deploy. Hooks per `install-agentic-coding-hooks.sh` im Repo installieren (R0).
- **Preise = ROT-Nähe:** „Preise/Konditionen ändern" ist global ROT. Zulässig ist ausschließlich der lesende, versionierte, auditierbare ERP-Sync (Feature 3); Admin-UI zeigt Preise read-only; die serverseitige Preis-Engine ist die einzige Wahrheit; `price_is_final` nie true bei Verwiegung. Jede Abweichungsbehandlung (Rundung, MwSt) braucht Kundenabnahme. Ebenfalls ROT: Kundendaten-Export/-Weitergabe (→ Enumeration-Schutz, keine agentischen Datenexporte).
- **PROD ist GELB:** jedes PROD-Deployment nur mit ausdrücklicher menschlicher Freigabe, Backup-/Rollback-Basis, `npm run typecheck` + `npm run build` grün, HTTP-/Browser-Smoke; ab R1 zusätzlich SMTP-Smoke; DEV-first auf hetzner-claw ohne Ausnahme. Nginx-/Tunnel-Änderungen auf PROD nur nach Freigabe (Tunnel-Routen auf claw sind Dashboard-verwaltet).
- **Security-Review vor jedem PROD-Deploy** (RLS-Policies, Auth-Pfade, CORS, Secrets, Dependency-Scan), Befunde in `09-Dokumentation/01-Projekte/<Projekt>/security-review.md`; **Secret-Scan vor jedem Commit/Push** (Gate 4, inkl. JWT-Krypto-Prüfung self-hosted Supabase-Keys — Vorgeschichte: getrackte env-Secrets 2026-06 entfernt, nicht wieder einführen).
- **Code-Standards:** TypeScript strict (kein `any`/`@ts-ignore`), `getUser()` vor jeder Mutation, RLS auf jeder neuen Tabelle (+ service_role-GRANT + PostgREST-Reload), Input-Validierung (zod, client+server geteilt), Conventional Commits, Context7 vor Library-Nutzung; UI deutsch mit korrekten Umlauten, Code englisch.
- **Tracking:** alle Arbeitspakete im Hermes-Board `containerdienst-seyfarth` (explizit `--board` setzen; Shorthand `seyfarth` archiviert); Doku-Pflichten (Change-Logs, Runbooks, `projekt_status` im selben Sprint) gemäß Dokumentationspflicht-Agenten.