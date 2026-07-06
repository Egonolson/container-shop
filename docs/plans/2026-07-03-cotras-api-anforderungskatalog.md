# Schnittstellen-Anforderungskatalog CoTraS ↔ Seyfarth-Onlineshop

| | |
|---|---|
| **Adressat** | Computer Service Hess (Schnittstellen-Entwicklung CoTraS) |
| **Auftraggeber** | Christoph Seyfarth, Containerdienst Seyfarth |
| **Ersteller** | Vision X Digital |
| **Stand** | 03.07.2026 · Version 1.1 (überarbeitet nach internem Review, versandreif) |

> **Hinweis zu allen Endpunkt- und Feldnamen in diesem Dokument:** Alle Pfade und Feldbezeichnungen sind **Vorschläge**. Hess darf anders benennen — verbindlich ist die **Semantik** (stabile IDs, Delta-Fähigkeit, Löschkennzeichen, ID-Rückgabe bei Schreiboperationen), nicht das Naming.

---

## 1 Zweck & Kontext

Der Onlineshop der Containerdienst Seyfarth (containerdienst-seyfarth.de) wird zu einem Kundenportal ausgebaut: Bestandskunden melden sich an, sehen ihre Preise, Baustellen, Aufträge und Rechnungen und lösen verbindliche Bestellungen aus. Die fachliche Datenhoheit bleibt vollständig im ERP **CoTraS** (Computer Service Hess); der Shop (Vision X Digital) hält lediglich einen **entkoppelten, lesenden Spiegel** dieser Daten.

**Rollenverteilung:**

- **Hess** stellt eine REST-Schnittstelle an CoTraS bereit (lesend; Schreiboperationen nur in klar benannten Fällen der Welle 2).
- **Vision X Digital** baut den Shop-seitigen Sync-Worker, den Datenspiegel und die Portal-Oberfläche.
- **Seyfarth** bleibt fachlicher Herr der Daten: Preise, Kunden, Aufträge und Rechnungen werden ausschließlich in CoTraS gepflegt.

**Architekturprinzip — Pull mit entkoppeltem Spiegel:** Der Shop ruft die CoTraS-API zyklisch ab (15–60 Minuten, plus nächtlicher Voll-Abgleich zur Selbstheilung) und speichert die Daten in eigenen, read-only Spiegeltabellen. Es gibt **keinen Live-Durchgriff** zur Laufzeit: Ein Ausfall von CoTraS oder der API trifft den laufenden Shop-Betrieb nicht. Eine 24/7-Verfügbarkeit der API ist daher **nicht** erforderlich.

**Zwei Lieferwellen:**

| Welle | Datenbereiche | Bedarf |
|---|---|---|
| **Welle 1** | Kundenstamm · Artikel/Katalog/Preise/Containertypen (ggf. Transportzonen) | **Wird zuerst gebraucht** — Grundlage für Bestandskunden-Matching und die serverseitige Preisberechnung |
| **Welle 2** | Baustellen/Lieferorte · Rechnungen/Belege · Aufträge/Auftragsstatus/Wiegedaten | Folgt nach stabiler Lesestrecke der Welle 1 |

Welle 1 besteht ausschließlich aus **GET-Endpunkten** (Pull-only, lesend). Schreiboperationen (Baustellen-Anlage, Auftragsübergabe) sind Welle-2-Themen und dort jeweils als eigenständig lieferbare Ausbaustufen beschrieben.

> ### ★ Kernfrage — bitte vorab klären, bevor die Entwicklung startet
>
> **Führt CoTraS kundenindividuelle Preise, Preislisten, Rabatte oder Sonderkonditionen?** Der gesamte Katalog-Datenbereich (Abschnitt 3.2) beschreibt bislang **eine einzige, globale Artikelpreisliste**. Bei einem B2B-Containerdienst mit langjährigen Gewerbekunden ist es aber wahrscheinlich, dass einzelne Kunden individuelle Preise oder Rabattstaffeln haben. Falls ja, sähen Bestandskunden im Portal **falsche Preise** — das ist keine Nebensache, sondern der wichtigste Punkt dieses gesamten Dokuments, weil er das Preis-Datenmodell direkt betrifft. Falls kundenindividuelle Preise existieren, wird zusätzlich benötigt: entweder ein `price_group`-Feld am Kunden (Abschnitt 3.1), das auf eine Preisgruppe im Katalog verweist, oder ein eigener Endpunkt `GET /api/v1/customers/{customer_id}/prices`, der die kundenspezifischen Abweichungen von der Standardpreisliste liefert. Diese Frage steht deshalb auch in Kapitel 4 an erster Stelle.

---

## 2 Allgemeine Anforderungen (gelten für jeden Endpunkt beider Wellen)

Diese Querschnittsregeln gelten für **alle** in Kapitel 3 beschriebenen Datenbereiche und werden dort nicht wiederholt. Sie sind Voraussetzung für das gemeinsame Go/No-Go (Read-Smoke gegen das Testsystem, siehe Kapitel 5).

### 2.1 Authentifizierung

- **Empfehlung: statischer API-Key im HTTP-Header** (z. B. `X-Api-Key`), pro Umgebung (Test/Prod) ein eigener Key, mindestens 32 Byte Entropie.
- Key-**Rotation** soll möglich sein (SOLL, nicht MUSS): ein kurzes, vorher abgestimmtes Wartungsfenster für den Key-Tausch genügt — ein Übergangsfenster mit zwei parallel gültigen Keys ist nicht zwingend, da es genau einen Server-zu-Server-Konsumenten gibt (Single-Consumer, kein Nutzer-seitiger Rotationsdruck).
- Begründung: Es gibt genau einen Server-zu-Server-Konsumenten (den Shop-Sync-Worker), keine Nutzer-Delegation, und der Shop hält ohnehin nur einen entkoppelten Spiegel — ein kurzer, angekündigter Ausfall beim Key-Tausch ist unkritisch. OAuth2 Client Credentials ist als Alternative akzeptiert, falls Hess das ohnehin im Stack hat — verpflichtend ist es nicht.
- Der Key darf **nie in URL/Query-Parametern** übertragen werden (landet sonst in Logs), nur im Header.

### 2.2 Transport (TLS)

Ausschließlich **HTTPS** (TLS 1.2+, gültiges Zertifikat). Keine Self-Signed-Zertifikate in Produktion ohne Absprache; Klartext-HTTP wird vom Shop nicht angesprochen. Gilt auch für das Testsystem.

### 2.3 Versionierung

- Pfad-Präfix **`/api/v1/`**.
- **Additive Änderungen** (neue Felder) sind jederzeit ohne Ankündigung erlaubt — der Shop toleriert unbekannte Felder.
- **Entfernen/Umbenennen von Feldern, Typ- oder Semantikänderungen** sind Breaking Changes und brauchen eine neue Major-Version (`/api/v2/`) mit Parallelbetriebsfenster.

### 2.4 Delta-Sync

Zwei taugliche Mechaniken:

- **(a) `updated_since`-Filter je Ressource** (`?updated_since=<ISO 8601>`): setzt ein serverseitig **zuverlässig gepflegtes Änderungsdatum** voraus, das **jede** relevante Änderung anhebt — auch Statuswechsel, das Setzen von Löschkennzeichen und Änderungen an **Unterobjekten** (z. B. Ansprechpartner oder Lieferadressen am Kunden). Kleine Überlappungsfenster sind unkritisch, weil der Shop idempotent per stabiler ID upsertet.
- **(b) Zentrales Änderungsjournal** (`GET /api/v1/changes?since=<Sequenznummer>&limit=<n>`): fortlaufende, lückenlose Sequenz von Änderungsereignissen (Entitätstyp, ID, Aktion created/updated/deleted). Robuster gegen Uhren-Drift, aber mehr Aufwand auf ERP-Seite.

**Empfehlung:** Variante (a) als MUSS für alle Ressourcen, Journal (b) als KANN — eines von beiden genügt. Zusätzlich MUSS jede Ressource **ungefiltert vollständig abrufbar** sein (nächtlicher Voll-Abgleich als Selbstheilung). Antworten sollen eine **Server-Zeit** mitliefern, damit der Shop den nächsten Delta-Anker ohne Uhren-Drift setzen kann. Kein Ergebnis = **HTTP 200 mit leerem Array**, nie 404.

### 2.5 Löschkennzeichen statt Hard-Delete

Gelöschte oder deaktivierte Datensätze müssen für den Shop **erkennbar bleiben**: entweder ein Flag (`is_deleted=true` / `deleted_at` / Statuswert), das weiterhin im `updated_since`-Delta erscheint, oder ein Journal-Eintrag `action=deleted`. **Stilles Verschwinden aus der Antwortmenge ist als einzige Mechanik nicht akzeptabel** — der Spiegel könnte Löschungen dann nur über den Voll-Abgleich erraten. Der Shop macht daraus grundsätzlich Soft-Handling (Archivierung), nie Hard-Deletes.

### 2.6 Stabile externe IDs

Jede Entität trägt eine **unveränderliche, eindeutige, nie wiederverwendete ID** (Kundennummer, Artikelnummer, Baustellen-ID, Auftrags-ID, Rechnungs-ID) als Pflichtfeld. Sie ist der Upsert-Schlüssel des Spiegels; eine ID-Änderung gilt als neue Entität. Interne Autoinkrement-IDs sind in Ordnung, solange diese Garantien gelten. **Alle Entitäten referenzieren einander über denselben ID-Raum**: `customer_id` am Auftrag ist exakt die ID aus dem Kundenstamm-Endpunkt, `artikel_id` in Auftragspositionen die aus dem Katalog usw.

### 2.7 Paginierung

Jeder Listen-Endpunkt paginiert (Vorschlag `?page=&page_size=` oder `?limit=&offset=`; Cursor ist ebenso akzeptabel) mit `has_more`-Flag oder Gesamtanzahl. **Stabile, deterministische Sortierung** (z. B. nach `updated_at, id`), damit Seiten während eines Sync-Laufs konsistent bleiben. Default-/Max-Seitengröße dokumentieren (Vorschlag: Default 100, Max 500). Bei sehr kleinen Datenmengen (z. B. Katalog, ~60 Artikel) ist Paginierung optional.

### 2.8 Fehlerformat

Korrekte HTTP-Statuscodes (200 · 400 Validierung · 401 fehlender/falscher Key · 403 IP/Rechte · 404 · 409 Konflikt · 422 semantisch ungültig · 429 Rate-Limit mit `Retry-After`-Header · 500 · 503 Wartung mit `code=MAINTENANCE`) plus einheitliches JSON-Fehlerobjekt:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| `error.code` | MUSS | Stabiler, maschinenlesbarer Code (z. B. `VALIDATION_ERROR`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`, `INTERNAL_ERROR`, `MAINTENANCE`) — der Shop verzweigt darauf (Retry vs. Alert vs. Quarantäne); Codes dürfen sich zwischen Versionen nicht ändern |
| `error.message` | MUSS | Menschenlesbare Beschreibung (Deutsch oder Englisch, UTF-8); keine Stacktraces, keine SQL-Fragmente, keine Kundendaten |
| `error.details[]` | KANN | Feldbezogene Detailfehler (`field` + `issue`) — v. a. für Schreiboperationen der Welle 2 |
| `error.request_id` | SOLL | Korrelations-ID, die auch in Hess-Logs auffindbar ist |
| `error.timestamp` | SOLL | Serverzeitpunkt des Fehlers, ISO 8601 |

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Der Parameter 'updated_since' ist kein gültiger ISO-8601-Zeitstempel.",
    "details": [
      {
        "field": "updated_since",
        "issue": "Erwartet Format wie 2026-07-03T06:00:00Z, erhalten: '03.07.2026'"
      }
    ],
    "request_id": "req_8f3a2c91d4",
    "timestamp": "2026-07-03T14:31:07Z"
  }
}
```

Niemals HTML-Fehlerseiten mit Status 200, niemals Fehlertext im Body bei HTTP 200. Dokumentierte Endpunkte dürfen im Regelbetrieb nicht 500 liefern — das ist ausdrücklicher Abnahme-Bestandteil.

### 2.9 Zeitstempel

**Verbindlicher Standard: ISO 8601 in UTC mit Z-Suffix** (`2026-07-03T14:30:00Z`) — durchgängig über alle Endpunkte, auch in diesem Dokument. Kein lokaler Zeitversatz (`+02:00` o. ä.), keine deutschen Datumsformate (`03.07.2026`), keine Mischung aus Unix-Timestamps und ISO-Strings. Rechnet CoTraS intern mit Europe/Berlin: die API liefert trotzdem in UTC — die Umrechnung liegt bei Hess, nicht beim Shop.

### 2.10 Zeichencodierung (UTF-8)

Durchgängig `Content-Type: application/json; charset=utf-8`. Umlaute und ß müssen korrekt ankommen: keine Latin-1/Windows-1252-Reste, keine Ersatzschreibweisen (ue/oe/ae), kein Doppel-Encoding/Mojibake („MÃ¼ller"). Gemeinsamer Abnahme-Testfall wird vereinbart, z. B. Kunde „Müller-Lüdenscheidt" in der „Weißenfelser Straße" mit Artikel „Grünschnitt".

### 2.11 Dezimalformat für Beträge

- **Empfehlung:** Beträge als **JSON-String mit Punkt als Dezimaltrenner** und fester Nachkommastellenzahl (Preise 2, ggf. 4 bei Einheitspreisen), z. B. `"23.50"` — vermeidet Binär-Float-Rundungsfehler. Akzeptierte Alternative: Integer-Cent (`2350`) oder JSON-Number mit Punkt, sofern maximal 2 Nachkommastellen garantiert sind.
- **Nicht akzeptabel:** Komma als Dezimaltrenner (`"23,50"`), Tausendertrenner, formatierte Strings mit Währungszeichen (`"23,50 €"`).
- Währung als eigenes Feld (`"currency": "EUR"`, Default EUR). **Netto, USt-Satz und ggf. Brutto immer als getrennte, explizit benannte Felder** — der Shop persistiert Netto/USt/Brutto getrennt und rechnet Brutto selbst. Konsistenzregel: Netto + USt = Brutto muss je Beleg exakt aufgehen.
- PLZ immer als **String** (führende Null: `"04639"`), nie als Zahl.
- Boolesche Werte als `true`/`false` (nicht `0/1` oder `"J"/"N"`), leere Listen als `[]` statt `null`, einheitliches Namensschema über alle Endpunkte (gleiches Konzept = gleicher Feldname, z. B. überall `customer_id`).

### 2.12 Idempotenz bei Schreiboperationen (Welle 2)

Wiederholte identische Requests (Netzwerk-Retry) dürfen **keine Dubletten** erzeugen: entweder ein Idempotency-Key-Header oder eine **client-vergebene externe Referenz** (z. B. `portal_reference`), die CoTraS als Unique-Schlüssel behandelt. POST-Antworten liefern die erzeugte ERP-ID zurück (Pflicht für den Rücksync-Status des Shops).

**Verbindliche Antwortsemantik:** Der **erste** POST mit einer neuen `portal_reference` liefert `HTTP 201` mit der neu angelegten Ressource. Ein **wiederholter** POST mit **derselben** `portal_reference` liefert `HTTP 200` (nicht erneut 201) mit der bereits angelegten Ressource und einem zusätzlichen Feld `"duplicate": true` — es entsteht in keinem Fall eine zweite Anlage.

```json
// erster POST mit portal_reference "7f3d2c9a-..."
{ "site_id": "BST-000533", "portal_reference": "7f3d2c9a-...", "duplicate": false }

// wiederholter POST mit identischer portal_reference (z. B. nach Timeout/Retry)
{ "site_id": "BST-000533", "portal_reference": "7f3d2c9a-...", "duplicate": true }
```

### 2.13 Testsystem

**Zweistufig, damit der kritische Pfad nicht an der aufwendigsten Vorleistung hängt:**

- **Für den ersten Read-Smoke (Go/No-Go, MUSS) genügt ein synthetischer Minimaldatensatz:** 5–10 Kunden (mit Umlauten, mindestens einer Gewerbe- und einer Privatperson), ca. 20 Artikel (mit mindestens einem Gefahrstoff-AVV-Stern-Fall und einem gelöschten Artikel), je 2–3 Baustellen/Rechnungen/Aufträge/Wiegungen. Dieser Datensatz kann von Hess frei erfunden werden — keine Anonymisierung von Echtdaten nötig.
- **Für die Abnahme je Welle (SOLL)** wird daraus eine vollständigere, anonymisierte bzw. pseudonymisierte Test-/Staging-Instanz mit realistischer Datenvielfalt (Dubletten, Statuswechsel, Korrekturen). Hintergrund DSGVO: Ein Echtkundendaten-Export ist bei VXD als kritisch klassifiziert und läuft ausschließlich über den menschlichen Prozess nach AVV-Klärung.

**Der Read-Smoke gegen den Minimaldatensatz ist das Go/No-Go-Gate — ohne ihn keine verbindlichen Feature-Zusagen für die Folge-Releases.**

### 2.14 Healthcheck & Monitoring

- `GET /api/v1/health`: liefert Status (ok/degraded), Serverzeit (ISO 8601) und API-Version — ohne fachliche Daten, ohne teure DB-Abfragen, Antwortzeit < 1 s. Grundlage des Shop-Alertings (ausbleibende Sync-Läufe dürfen nie still bleiben).
- **Keine 24/7-SLA nötig** (entkoppelter Spiegel). Erwartung: Erreichbarkeit zu Geschäftszeiten, geplante Wartungsfenster vorab per Mail, ungeplante Ausfälle > 24 h aktiv melden. Bei Wartung: 503 mit Fehlerobjekt statt Timeout.

```json
// GET /api/v1/health
{
  "status": "ok",
  "server_time": "2026-07-03T14:30:00Z",
  "api_version": "1.0"
}
```

### 2.15 Rate Limits

Dokumentierte Limits genügen — das Shop-Volumen ist bewusst klein: Pull-Läufe alle 15–60 Minuten mit paginierten Reads (einige hundert Datensätze je Lauf), nächtlicher Voll-Abgleich, vereinzelte On-Demand-Abrufe (Rechnungs-/Wiegeschein-PDF). Bei 429 sendet der Shop Backoff-Retries und respektiert `Retry-After`.

### 2.16 IP-Allowlist (optional, Defense-in-Depth)

Der API-Zugriff kann serverseitig auf die statischen IPs der beiden Shop-Server (DEV + PROD, Hetzner) eingeschränkt werden; VXD liefert die IPv4-/IPv6-Adressen. Die Allowlist ergänzt die Key-Authentifizierung, ersetzt sie nicht.

### 2.17 Webhooks (Phase 2, optional)

Kein Bestandteil der Welle 1 — Pull bleibt führend. Später wünschenswert: Push bei Auftragsstatus-Änderungen (insbesondere Status „Abgeschlossen", siehe 3.5) als HMAC-signierter POST (Shared Secret, Zeitstempel gegen Replay, Retry bei Nichterreichbarkeit). Jetzt nur mitzudenken: Statusänderungen müssen das Änderungsdatum anheben, damit sie auch per Pull-Delta sichtbar sind.

### 2.18 Spezifikation

**OpenAPI-3.x-Dokument plus Beispiel-Payloads je Endpunkt (SOLL)** — als Endpunkt (`GET /api/v1/openapi.json`) oder als gelieferte Datei. Grundlage für das Spezifikations-Review vor Entwicklungsstart und für den VXD-Mock-Adapter, mit dem der Shop parallel zur Hess-Entwicklung gebaut wird.

### 2.19 DSGVO-Datenminimierung (verbindlich)

Jeder Endpunkt liefert **nur die in diesem Katalog spezifizierten Felder** — insbesondere keine Bonitäts-/Umsatzdaten, Geburtsdaten, internen Notizen, Rechnungspositionen, Bankverbindungen oder Mahn-/Inkassodaten. Was das Portal nicht anzeigt, wird nicht übertragen und nicht gespiegelt.

### 2.20 Datenminimierung auf Datensatzebene & Auftragsverarbeitung

2.19 regelt die **Feldebene** (welche Spalten). Diese Regel ergänzt die **Datensatzebene** (welche Zeilen):

- Der Shop spiegelt den Kundenstamm und die Rechnungsmetadaten technisch **vollständig** — auch für Kunden, die nie ein Portal-Konto anlegen. Das ist notwendig, weil das Matching (Abschnitt 3.1) erst beim Registrierungszeitpunkt weiß, welcher ERP-Kunde gemeint ist, und weil der globale Delta-Strom (Abschnitt 3.4) technisch keine Vorab-Filterung nach „wird später verknüpft" erlaubt.
- **Aufbewahrung im Spiegel folgt dem Löschkonzept des Shops:** Tombstones (Löschkennzeichen aus 2.5) werden aus der API nachgezogen und wirken auch auf den Spiegel; ein DSGVO-Löschersuchen eines Endkunden gegenüber Seyfarth wirkt damit ebenso auf die im Shop gespiegelte Kopie.
- Die **Auftragsverarbeitungs-/Verantwortlichkeits-Klärung zwischen Seyfarth und Computer Service Hess** (AVV, Support-Zugriffe auf das Testsystem, Zugriff auf produktive Daten bei Fehleranalyse) läuft parallel zu diesem Katalog und ist kein technisches, sondern ein vertragliches Thema (siehe Release-Plan, Frage zur AVV-Klärung).
- **Alternativ-Option, falls für Hess leicht umsetzbar:** Ein Filterparameter `?linked_only=true` am Rechnungs-Delta-Endpunkt, der nur Belege bereits verknüpfter Kunden liefert, würde die gespiegelte Datenmenge weiter reduzieren — das ist ein Optimierungswunsch, keine Bedingung für Welle 2.

---

## 3 Datenbereiche

### 3.1 Kundenstamm (Welle 1)

#### Zweck

Registrierte, E-Mail-verifizierte Portal-Konten werden serverseitig über vier Matchfelder — **E-Mail, Vor-/Zuname (bzw. Firmierung), Adresse (normalisiert), USt-ID** — ihrem CoTraS-Kundenkonto zugeordnet. Automatische Verknüpfung nur bei exaktem Treffer der verifizierten E-Mail mit eindeutigem Kandidaten; alle Grenzfälle gehen in eine manuelle Freigabe-Queue bei Seyfarth. Der Shop hält dafür einen entkoppelten, read-only Spiegel, der Endkunden nie direkt zugänglich ist. Die verlässliche Kundenzuordnung ist zugleich das Fundament für Baustellen-Import und Rechnungszuordnung in Welle 2 — ohne sie werden keine kundenspezifischen ERP-Daten im Portal angezeigt.

#### Endpunkt-Vorschläge

| Endpunkt (Vorschlag) | Zweck | Delta/Parameter |
|---|---|---|
| `GET /api/v1/customers` | Paginierter Voll- und Delta-Abruf des Kundenstamms für den zyklischen Pull-Sync; initialer Vollabzug muss möglich sein | `?updated_since=<ISO 8601 UTC>`, kombinierbar mit Paginierung; Delta muss auch Tombstones (`status=geloescht/gesperrt`) enthalten |
| `GET /api/v1/customers/{customer_id}` | Gezielter Einzelabruf per stabiler Kundennummer — Re-Sync einzelner Sätze, Prüffälle in der Match-Freigabe-Queue | kein Delta-Parameter nötig; 404 bzw. `status=geloescht` bei entferntem Kunden statt leerer Antwort |

#### Feldliste

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `customer_id` | string | MUSS | Stabile, eindeutige, nie wiederverwendete Kundennummer/ID — Anker aller späteren Verknüpfungen (Baustellen, Rechnungen, Aufträge) |
| `customer_kind` | enum `privat` \| `gewerblich` | MUSS | Kundentyp — steuert Matching-Gewichtung (USt-ID zählt nur bei Gewerbe) und Abgleich mit dem Portal-Kontotyp |
| `company_name` | string \| null | MUSS | Firmierung; Pflicht bei gewerblich (Namens-Matchfeld), null bei privat |
| `first_name` | string \| null | MUSS | Vorname, **getrennt** vom Nachnamen; Pflicht bei Privatkunden — kombinierte Namensfelder verschlechtern die Match-Qualität messbar |
| `last_name` | string \| null | MUSS | Nachname, getrennt vom Vornamen; Pflicht bei Privatkunden |
| `emails` | string[] | MUSS | Alle am Konto hinterlegten E-Mail-Adressen (Matchfeld 1). Führt CoTraS nur ein Feld: Array mit einem Eintrag. Haupt-/Match-Referenz kennzeichnen oder an erster Stelle liefern |
| `billing_address` | object `{street, house_number, postal_code, city, country}` | MUSS | Rechnungsadresse, strukturiert bevorzugt (Matchfeld Adresse; PLZ exakt als starkes Teilmerkmal). `country` als ISO 3166-1 alpha-2, Default DE. Freitext nur als dokumentierte Rückfalloption |
| `vat_id` | string \| null | MUSS | USt-IdNr. (Matchfeld 4; bei Gewerbekunden höchstgewichtet). Nullable-MUSS: das Feld muss existieren, auch wenn nicht überall befüllt |
| `status` | enum `aktiv` \| `gesperrt` \| `geloescht` | MUSS | Gesperrte/gelöschte Kunden werden nie automatisch verknüpft; Tombstone im Delta statt stillem Verschwinden |
| `updated_at` | string, ISO 8601 UTC | MUSS | Letzte Änderung **einschließlich Unterobjekte** (Ansprechpartner, Lieferadressen) — Grundlage des Delta-Syncs |
| `phone` | string \| null | SOLL | Kein Matchfeld, aber Kontext für die Freigabe-Queue und Profil-Vorbefüllung |
| `delivery_addresses` | object[] `{address_id, street, house_number, postal_code, city, country}` | SOLL | Abweichende Lieferadressen mit je stabiler `address_id` — erhöht die Trefferquote; Vorgriff auf die Baustellen-Entität (Welle 2), ersetzt sie nicht |
| `contacts` | object[] `{contact_id, name, email, phone, role}` | SOLL | Ansprechpartner bei Gewerbekunden — liefert zusätzliche Match-E-Mails und Queue-Kontext. Datenminimierung: nur geschäftliche Kontaktdaten; `phone`/`role` optional |
| `merged_into` | string \| null | SOLL | Verweis auf den führenden Kundensatz bei Dubletten-Zusammenführung im ERP — nur so bleiben Portal-Verknüpfungen intakt. Das Portal erkennt und meldet Dubletten, bereinigt aber nie im ERP |
| `created_at` | string, ISO 8601 UTC \| null | KANN | Anlagedatum im ERP — Plausibilisierung in der Freigabe-Queue, kein Matching |

> **`payment_terms` (kundenindividuelle Zahlungskonditionen) kommt bewusst erst mit Welle 2:** In Welle 1 ungenutzt (Matching und Portal-Login brauchen es nicht) — nach dem Datenminimierungsgrundsatz aus 2.19/2.20 wird es hier nicht angefordert und erst relevant, sobald Bestellung/Rechnung (Welle 2) es tatsächlich anzeigen.

#### Beispiel

```json
{
  "data": [
    {
      "customer_id": "K-10234",
      "customer_kind": "gewerblich",
      "company_name": "Bauunternehmen Müller & Söhne GmbH",
      "first_name": null,
      "last_name": null,
      "emails": ["info@mueller-soehne-bau.de", "buchhaltung@mueller-soehne-bau.de"],
      "phone": "+49 3447 512340",
      "vat_id": "DE812345678",
      "billing_address": {
        "street": "Leipziger Straße",
        "house_number": "14a",
        "postal_code": "04600",
        "city": "Altenburg",
        "country": "DE"
      },
      "delivery_addresses": [
        {
          "address_id": "LA-2201",
          "street": "Geraer Straße",
          "house_number": "8",
          "postal_code": "04626",
          "city": "Schmölln",
          "country": "DE"
        }
      ],
      "contacts": [
        {
          "contact_id": "AP-311",
          "name": "Katrin Müller",
          "email": "k.mueller@mueller-soehne-bau.de",
          "phone": "+49 3447 512341",
          "role": "Bauleitung"
        }
      ],
      "status": "aktiv",
      "merged_into": null,
      "created_at": "2019-03-12T09:15:00Z",
      "updated_at": "2026-06-28T14:32:11Z"
    },
    {
      "customer_id": "K-20517",
      "customer_kind": "privat",
      "company_name": null,
      "first_name": "Jörg",
      "last_name": "Weißgerber",
      "emails": ["joerg.weissgerber@example.de"],
      "phone": "+49 172 3456789",
      "vat_id": null,
      "billing_address": {
        "street": "Käthe-Kollwitz-Straße",
        "house_number": "3",
        "postal_code": "07546",
        "city": "Gera",
        "country": "DE"
      },
      "delivery_addresses": [],
      "contacts": [],
      "status": "gesperrt",
      "merged_into": null,
      "created_at": "2023-08-02T07:44:00Z",
      "updated_at": "2026-07-01T06:05:43Z"
    }
  ],
  "pagination": { "page": 1, "page_size": 500, "total_items": 2, "total_pages": 1 }
}
```

Einzelabruf `GET /api/v1/customers/K-10234`:

```json
{
  "customer_id": "K-10234",
  "customer_kind": "gewerblich",
  "company_name": "Bauunternehmen Müller & Söhne GmbH",
  "emails": ["info@mueller-soehne-bau.de"],
  "vat_id": "DE812345678",
  "billing_address": {
    "street": "Leipziger Straße",
    "house_number": "14a",
    "postal_code": "04600",
    "city": "Altenburg",
    "country": "DE"
  },
  "status": "aktiv",
  "updated_at": "2026-06-28T14:32:11Z"
}
```

#### Besondere Anforderungen

- **Pull-only, ausschließlich lesend:** keine Write-Endpunkte für den Kundenstamm in Welle 1. Die Übernahme von Portal-Neukunden ins ERP bleibt vorerst manueller Prozess bei Seyfarth.
- **Unterobjekte im Delta:** Änderungen an Ansprechpartnern, Lieferadressen oder Zahlungskonditionen müssen das `updated_at` des Kunden anheben — sonst verpasst der Delta-Sync sie.
- **Dubletten:** Zusammenführungen im ERP werden über `merged_into` abgebildet; `customer_id`, `address_id` und `contact_id` sind über die gesamte Lebensdauer stabil.
- **DSGVO-Datenminimierung:** Die API liefert keine Felder über die obige Liste hinaus — die vier Matchfelder sind damit vollständig abgedeckt, mehr braucht das Portal nicht.
- **Volumen:** Größenordnung des Kundenstamms bitte dokumentieren (siehe Fragen), damit der Sync-Worker (Retry mit Backoff) dimensioniert werden kann.

---

### 3.2 Katalog & Preise: Artikel, Containertypen, Transportzonen (Welle 1)

#### Zweck

Der Shop spiegelt Abfallarten, Baustoffe, Containertypen und (falls in CoTraS gepflegt) die Zonen-Preismatrix lesend und delta-fähig. Neue Artikel landen shopseitig grundsätzlich **inaktiv** und werden erst nach manueller redaktioneller Anreicherung und Freigabe öffentlich sichtbar. Diese Daten sind die **einzige Preisquelle** der serverseitigen Preisberechnung für Kalkulationen und verbindliche Bestellungen registrierter Kunden — inklusive Preishistorisierung: Jede Kundenkalkulation referenziert eine Preislisten-Version (Snapshot-Pflicht). **Die Preishoheit bleibt vollständig bei CoTraS/Seyfarth; der Shop schreibt niemals Preise zurück** — es gibt keine Schreib-Endpunkte für Preise.

#### Endpunkt-Vorschläge

| Endpunkt (Vorschlag) | Zweck | Delta/Parameter |
|---|---|---|
| `GET /api/v1/articles` | Alle verkaufs-/anfragerelevanten Artikel: Abfallarten (AVV/ASN, Gefahrstoff, Bearbeitungsgebühren) und Baustoffe (Kategorie, Material, Körnung), je mit Nettopreis, Preiseinheit, USt-Satz. Ohne Parameter: Vollexport | `?updated_since=<ISO 8601 UTC>` — nur seither geänderte **und** gelöschte Sätze (`is_deleted=true`); optional `?type=abfall\|baustoff` |
| `GET /api/v1/articles/{artikelnummer}` | Einzelabruf (KANN — Fehleranalyse/gezieltes Nachladen; entbehrlich bei zuverlässigem Listenabruf) | — |
| `GET /api/v1/container-types` | Containertypen als eigene Stammdaten-Entität: Art (Absetzer/Abroller/Multicar), Volumen m³, stabile ID, Zuordnung zur Gestellungspreis-Klasse. **Klarstellung:** Das ERP liefert hier nur die Containertypen/-größen/-preise als Stammdaten — das Mapping „welche Abfallart darf in welche Containergröße" wird **shopseitig** in `waste_item_rules` gepflegt (Produktentscheidung Seyfarth vom 2026-05-11); CoTraS muss dieses Mapping **nicht** liefern | `?updated_since=<ISO 8601 UTC>` |
| `GET /api/v1/transport-zones` | Zonen-Preismatrix (Zone 1–3): Gestellungspreis je Fahrzeug-/Containerklasse und Schüttgut-Lieferpreis je Fahrzeugart, netto + USt-Satz. **Nur bauen, falls die Matrix in CoTraS gepflegt ist** — sonst bleibt sie shopseitige Preisliste unter einem geregelten Pflegeprozess (s. u.) | `?updated_since=<ISO 8601 UTC>` |
| `GET /api/v1/transport-zones/locations` | PLZ→Zone-Zuordnung (heute 258 Einträge: PLZ, Ort, Zone 1–3). Gleiche Bedingung wie `/transport-zones` | `?updated_since=<ISO 8601 UTC>` |
| `GET /api/v1/catalog/price-state` | KANN: aktuelle Preisstands-/Versionskennung (z. B. Preislistendatum) — billiger Konsistenz-Check ohne Vollabruf. Alternativ genügt ein `preisstand`-Feld in jeder Antwort | — |

#### Feldliste — Artikel

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `artikelnummer` | string | MUSS | Stabile, eindeutige, nie wiederverwendete ERP-Artikelnummer — Upsert-Schlüssel des Spiegels |
| `bezeichnung` | string, UTF-8 | MUSS | Anzeigename mit korrekten Umlauten („Sperrmüll", „Grünschnitt") — wird shopseitig redaktionell angereichert, ERP-Name bleibt Referenz |
| `typ` | enum `abfall` \| `baustoff` \| `sonstiges` | SOLL | Klassifikation für die Shop-Zuordnung; falls nicht vorhanden: ersatzweise über Warengruppe ableitbar, Mapping dann shopseitig |
| `kategorie` | string | SOLL | Warengruppe („Bauschutt", „Gefährliche Abfälle", „Kiese", „Erden") für Filter/Kategoriezuordnung im Konfigurator |
| `avv_schluessel` | string \| null | MUSS | ASN/AVV-Abfallschlüssel **inklusive \*-Gefahrstoffkennung** als eigenes strukturiertes Feld (z. B. `170107`, `170603*`) — Pflicht bei Abfallarten, null bei Baustoffen |
| `gefahrstoff` | boolean | SOLL | Explizites Gefahrstoff-Flag zusätzlich zum \* — für fachlich gefährliche Fälle ohne \*-Schlüssel. Fallback: Shop leitet aus dem \* ab |
| `preis_netto` | number, Punkt-Dezimal | MUSS | Nettopreis je Preiseinheit (23.50) — nie formatierter String. Einzige Preisquelle des Shops |
| `preiseinheit` | enum `t` \| `stueck` \| `m3` | MUSS | Abrechnungseinheit — steuert Verwiegungslogik (t) vs. Stück-/Volumenpreis. Werte-Codes final abstimmen |
| `ust_satz` | number, Prozent | MUSS | USt-Satz je Position (z. B. 19.0) — ohne ihn keine korrekte Privat-/Gewerbe-Anzeige |
| `waehrung` | string, ISO 4217 | KANN | Default EUR, falls nicht geliefert |
| `bearbeitungsgebuehr_netto` | number \| null | **MUSS, sofern** Gebühren in CoTraS als Attribut am Artikel geführt werden | Optionale Bearbeitungsgebühr netto (fachlich vorhanden z. B. bei Asbest, Mineralwolle/KMF, teerhaltiger Dachpappe). null = keine Gebühr. **Werden Gebühren in CoTraS stattdessen als eigene Artikel geführt, entfällt dieses Feld und wird durch ein Verknüpfungsfeld `fee_article_id` (Referenz auf den Gebühren-Artikel) ersetzt** — welche Variante zutrifft, klärt Frage 21 |
| `bearbeitungsgebuehr_einheit` | enum `auftrag` \| `t` \| `stueck` \| `m3` \| null | SOLL | Bezugsgröße der Gebühr (pauschal je Auftrag oder mengenbezogen) |
| `material` | string \| null | SOLL | Nur Baustoffe: strukturierter Materialname („Kulturboden", „Betonrecycling") — sonst muss der Shop aus Freitext parsen |
| `koernung` | string \| null | SOLL | Nur Baustoffe: Körnung/Spezifikation („0/32 mit Zertifikat") |
| `is_deleted` | boolean | MUSS | Löschkennzeichen — gelöschte/deaktivierte Artikel erscheinen mit `true` im Delta; Shop archiviert automatisch und alarmiert |
| `gueltig_ab` | string, ISO-Datum | SOLL | Preisgültigkeit ab — ermöglicht saubere Preislisten-Versionierung und angekündigte Preisänderungen |
| `gueltig_bis` | string, ISO-Datum \| null | KANN | Preis-/Artikelauslauf — Auslauf-Artikel können rechtzeitig deaktiviert werden |
| `updated_at` | string, ISO 8601 UTC | MUSS | Änderungszeitstempel — Basis des Deltas; **muss sich auch bei reinen Preisänderungen aktualisieren** |

#### Feldliste — Containertypen

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `containertyp_id` | string | MUSS | Stabile ID (Upsert-Schlüssel) |
| `art` | enum `absetzer` \| `abroller` \| `multicar` | MUSS | Containerart — steuert Fahrzeuglogik und Gestellungspreis-Klasse |
| `volumen_m3` | number | MUSS | Größe in m³ (3, 5, 7, 10, 12, 15–40) — Basis der Regel „erlaubte Containergrößen je Abfallart" |
| `bezeichnung` | string, UTF-8 | MUSS | Anzeigename („Absetzcontainer 7 m³") |
| `preisklasse` | enum `multicar` \| `absetzer` \| `abroller_5_7` \| `abroller_10_12` \| `abroller_15_40` | SOLL | Zuordnung zur Gestellungspreis-Spalte der Zonenmatrix; alternativ leitet der Shop sie aus Art + Volumen ab (fehleranfälliger) |
| `is_deleted` | boolean | MUSS | Löschkennzeichen analog Artikel |
| `updated_at` | string, ISO 8601 UTC | MUSS | Änderungszeitstempel für Delta |

#### Feldliste — Transportzonen & PLZ-Zuordnung (nur falls in CoTraS gepflegt)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `zone.zone` | integer enum 1 \| 2 \| 3 | MUSS | Preiszone |
| `zone.gestellung_netto` | object `{multicar, absetzer, abroller_5_7_m3, abroller_10_12_m3, abroller_15_40_m3}` | MUSS | Gestellungspreis netto je Fahrzeug-/Containerklasse (heutige Matrix Zone 1: 89/104/104/135/135 €) |
| `zone.schuettgut_lieferung_netto` | object `{multicar, absetzer, abroller}` | MUSS | Schüttgut-/Baustoff-Lieferpreis netto je Fahrzeugart (heutige Matrix Zone 1: 60/75/80 €) |
| `zone.ust_satz` | number, Prozent | MUSS | USt-Satz der Transport-/Gestellungsleistung |
| `zone.gueltig_ab` | string, ISO-Datum | SOLL | Gültigkeitsbeginn des Zonen-Preisstands |
| `zone.is_deleted` | boolean | MUSS | Löschkennzeichen — eine entfallende Zone darf nicht kommentarlos aus der Antwort verschwinden (Querschnittsregel 2.5 gilt auch hier) |
| `zone.updated_at` | string, ISO 8601 UTC | MUSS | Änderungszeitstempel für Delta |
| `plz.plz` | string, 5-stellig | MUSS | PLZ als String — führende Null erhalten („04639") |
| `plz.ort` | string, UTF-8 | MUSS | Ortsname (eine PLZ kann mehrere Orte/Zeilen haben) |
| `plz.zone` | integer enum 1 \| 2 \| 3 | MUSS | Zonenzuordnung — Grundlage der automatischen Zonenermittlung im Konfigurator |
| `plz.is_deleted` | boolean | MUSS | Löschkennzeichen — fällt eine PLZ aus dem Liefergebiet, muss das erkennbar sein statt stillem Verschwinden aus der Antwortmenge |
| `plz.updated_at` | string, ISO 8601 UTC | MUSS | Delta-Zeitstempel (bei nur 258 Einträgen ist zusätzlich ein Voll-Abgleich akzeptabel, ersetzt aber nicht das verbindliche Änderungsdatum) |

#### Beispiel

```json
{
  "GET /api/v1/articles?updated_since=2026-06-20T00:00:00Z": {
    "stand": "2026-07-03T04:30:00Z",
    "preisstand": "PL-2026-04",
    "artikel": [
      {
        "artikelnummer": "ENT-170107",
        "typ": "abfall",
        "kategorie": "Bauschutt",
        "bezeichnung": "Bauschutt rein",
        "avv_schluessel": "170107",
        "gefahrstoff": false,
        "preis_netto": 23.50,
        "preiseinheit": "t",
        "ust_satz": 19.0,
        "waehrung": "EUR",
        "bearbeitungsgebuehr_netto": null,
        "bearbeitungsgebuehr_einheit": null,
        "material": null,
        "koernung": null,
        "gueltig_ab": "2026-04-01",
        "gueltig_bis": null,
        "is_deleted": false,
        "updated_at": "2026-06-28T14:12:05Z"
      },
      {
        "artikelnummer": "ENT-170603",
        "typ": "abfall",
        "kategorie": "Gefährliche Abfälle",
        "bezeichnung": "Mineralwolle / KMF",
        "avv_schluessel": "170603*",
        "gefahrstoff": true,
        "preis_netto": 790.00,
        "preiseinheit": "t",
        "ust_satz": 19.0,
        "waehrung": "EUR",
        "bearbeitungsgebuehr_netto": 35.00,
        "bearbeitungsgebuehr_einheit": "auftrag",
        "material": null,
        "koernung": null,
        "gueltig_ab": "2026-04-01",
        "gueltig_bis": null,
        "is_deleted": false,
        "updated_at": "2026-06-25T08:03:41Z"
      },
      {
        "artikelnummer": "BST-KIE-0032",
        "typ": "baustoff",
        "kategorie": "Kiese",
        "bezeichnung": "Frostschutzkies 0/32",
        "avv_schluessel": null,
        "gefahrstoff": false,
        "preis_netto": 19.50,
        "preiseinheit": "t",
        "ust_satz": 19.0,
        "waehrung": "EUR",
        "bearbeitungsgebuehr_netto": null,
        "bearbeitungsgebuehr_einheit": null,
        "material": "Frostschutzkies",
        "koernung": "0/32 mit Zertifikat",
        "gueltig_ab": "2026-04-01",
        "gueltig_bis": null,
        "is_deleted": false,
        "updated_at": "2026-06-30T16:20:00Z"
      },
      {
        "artikelnummer": "BST-MUL-ALT",
        "typ": "baustoff",
        "kategorie": "Erden",
        "bezeichnung": "Rindenmulch grob (Altposition)",
        "avv_schluessel": null,
        "gefahrstoff": false,
        "preis_netto": 41.00,
        "preiseinheit": "m3",
        "ust_satz": 19.0,
        "waehrung": "EUR",
        "bearbeitungsgebuehr_netto": null,
        "bearbeitungsgebuehr_einheit": null,
        "material": "Rindenmulch",
        "koernung": "grob",
        "gueltig_ab": "2025-04-01",
        "gueltig_bis": "2026-06-30",
        "is_deleted": true,
        "updated_at": "2026-07-01T06:00:00Z"
      }
    ]
  },
  "GET /api/v1/container-types": {
    "stand": "2026-07-03T04:30:00Z",
    "containertypen": [
      { "containertyp_id": "MUC-03", "art": "multicar", "bezeichnung": "Multicar-Mulde 3 m³", "volumen_m3": 3.0, "preisklasse": "multicar", "is_deleted": false, "updated_at": "2026-05-02T09:14:00Z" },
      { "containertyp_id": "ABS-07", "art": "absetzer", "bezeichnung": "Absetzcontainer 7 m³", "volumen_m3": 7.0, "preisklasse": "absetzer", "is_deleted": false, "updated_at": "2026-05-02T09:14:00Z" },
      { "containertyp_id": "ABR-10", "art": "abroller", "bezeichnung": "Abrollcontainer 10 m³", "volumen_m3": 10.0, "preisklasse": "abroller_10_12", "is_deleted": false, "updated_at": "2026-05-02T09:14:00Z" },
      { "containertyp_id": "ABR-20", "art": "abroller", "bezeichnung": "Abrollcontainer 20 m³", "volumen_m3": 20.0, "preisklasse": "abroller_15_40", "is_deleted": false, "updated_at": "2026-05-02T09:14:00Z" }
    ]
  },
  "GET /api/v1/transport-zones (nur falls Zonenmatrix im ERP gepflegt)": {
    "stand": "2026-07-03T04:30:00Z",
    "preisstand": "PL-2026-04",
    "zonen": [
      {
        "zone": 1,
        "gestellung_netto": { "multicar": 89.00, "absetzer": 104.00, "abroller_5_7_m3": 104.00, "abroller_10_12_m3": 135.00, "abroller_15_40_m3": 135.00 },
        "schuettgut_lieferung_netto": { "multicar": 60.00, "absetzer": 75.00, "abroller": 80.00 },
        "ust_satz": 19.0,
        "gueltig_ab": "2026-04-01",
        "is_deleted": false,
        "updated_at": "2026-03-28T11:00:00Z"
      },
      {
        "zone": 2,
        "gestellung_netto": { "multicar": 95.00, "absetzer": 115.00, "abroller_5_7_m3": 115.00, "abroller_10_12_m3": 145.00, "abroller_15_40_m3": 145.00 },
        "schuettgut_lieferung_netto": { "multicar": 65.00, "absetzer": 80.00, "abroller": 85.00 },
        "ust_satz": 19.0,
        "gueltig_ab": "2026-04-01",
        "is_deleted": false,
        "updated_at": "2026-03-28T11:00:00Z"
      }
    ],
    "plz_orte": [
      { "plz": "04639", "ort": "Ponitz", "zone": 1, "is_deleted": false, "updated_at": "2026-03-28T11:00:00Z" },
      { "plz": "07545", "ort": "Gera", "zone": 2, "is_deleted": false, "updated_at": "2026-03-28T11:00:00Z" },
      { "plz": "09111", "ort": "Chemnitz", "zone": 3, "is_deleted": false, "updated_at": "2026-03-28T11:00:00Z" }
    ]
  },
  "GET /api/v1/catalog/price-state": {
    "preisstand": "PL-2026-04",
    "gueltig_ab": "2026-04-01",
    "server_time": "2026-07-03T04:30:00Z"
  }
}
```

#### Besondere Anforderungen

- **Preisstand/Versionierung:** Eine Antwort liefert einen in sich konsistenten Preisstand. Gewünscht ist eine Preisstands-/Versionskennung je Antwort (Feld `preisstand` oder eigener Endpunkt), damit der Shop auditierbare Preislisten-Versionen bilden kann — jede Kundenkalkulation referenziert diese Version (Snapshot-Pflicht).
- **Preisänderungen bumpen den Zeitstempel:** `updated_at` muss sich auch bei reinen Preisänderungen aktualisieren, sonst greift das Delta nicht.
- **Volumen (heutiger Stand):** ~42 Entsorgungspositionen, ~18 Baustoffe, ca. 10 Containertypen, 3 Zonen, 258 PLZ/Ort-Einträge — kleine Datenmengen, Vollexporte unkritisch, Paginierung optional.
- **Keine personenbezogenen Daten** in diesem Datenbereich — bitte auch keine mitliefern (keine eingebetteten Kunden-/Ansprechpartnerdaten in Artikel-Antworten).
- Testsystem-Beispieldaten sollen Umlaut-, Gefahrstoff- und Lösch-Fälle enthalten.
- **Governance-Fall „Zonen-Matrix bleibt shopseitig":** Beantwortet Hess die Zonen-Frage (Kapitel 4) mit „die PLZ-Zonen-Matrix wird nicht in CoTraS gepflegt", bleibt sie eine shopseitig gepflegte Preisliste — dann gilt ein definierter Pflegeprozess statt freier Bearbeitung: Import/Änderung ausschließlich durch einen Menschen mit Freigabe, versioniert über `price_list_versions` (dieselbe Versionierung wie beim Artikelpreisstand oben), vollständig auditierbar. Preisänderungen außerhalb eines freigegebenen ERP-Syncs sind bei VXD als ROT eingestuft (niemals automatisiert) — dieser Fall ist also kein technisches Detail, sondern eine bewusste Governance-Entscheidung, die im Shop-Betrieb dokumentiert wird.

---

### 3.3 Baustellen / Lieferorte (Welle 2)

#### Zweck

Gewerbekunden sehen nach dem Login alle in CoTraS hinterlegten Baustellen als wiederverwendbare Lieferorte, wählen sie im Bestell-/Anfrageflow per Klick aus (Adresse und PLZ-Zone werden automatisch übernommen) und legen neue Baustellen an, die kontrolliert ins ERP zurückfließen. Der Shop hält einen entkoppelten Lese-Spiegel (Pull, 15–60-Minuten-Takt, wie bei den übrigen Datenbereichen); die stabile Baustellen-ID ist zusätzlich Anker für die Auftragszuordnung im ERP und den Baustellen-Filter der Rechnungsanzeige.

**Feldhoheit:** CoTraS führt ID, Name, Adresse und Status; Geo-Pin, Anfahrtshinweise und Ansprechpartner-Ergänzungen bleiben portal-geführt und werden vom Sync **nie überschrieben** — dafür braucht der Shop von Hess nichts außer stabilen IDs und verlässlichen `updated_at`-Werten.

**Zwei Ausbau-Varianten (Entscheidung vor Umsetzungsstart nötig):**

- **Variante A (Voll-Sync, bevorzugt):** Lese-Endpunkte **plus** Schreib-API (POST) mit synchroner ID-Rückgabe.
- **Variante B (Fallback):** nur Lese-Endpunkte; portal-angelegte Baustellen bleiben dauerhaft portal-geführt und werden ausschließlich als strukturierter Lieferort-Block am Auftrag übergeben — dann **muss** der Auftrags-Endpunkt (Abschnitt 3.5) einen vollständigen Lieferort-Block (Bezeichnung, Straße, Hausnummer, PLZ, Ort, Ansprechpartner, optional Geo) akzeptieren.

Der Shop ist auf beide Varianten vorbereitet; die Lese-Endpunkte werden in beiden Fällen benötigt.

#### Endpunkt-Vorschläge

| Endpunkt (Vorschlag) | Zweck | Delta/Parameter |
|---|---|---|
| `GET /api/v1/construction-sites` | Delta-Strom über alle Baustellen aller Kunden — primärer Endpunkt für den periodischen Pull und den nächtlichen Voll-Abgleich; muss auch Status- und Löschänderungen liefern | `?updated_since=<ISO 8601 UTC>`; optional `&status=aktiv\|abgeschlossen`, `&page=` |
| `GET /api/v1/customers/{customer_id}/construction-sites` | Alle Baustellen eines Kunden — Initial-Import nach Bestandskunden-Match, gezielter Einzel-Kunden-Refresh nach Freigabe in der Match-Queue | `?updated_since=` optional; ohne Parameter = Vollbestand des Kunden |
| `GET /api/v1/construction-sites/{site_id}` | Einzelabruf — Verifikation nach POST, gezieltes Nachladen bei Sync-Fehlern (KANN, ersatzweise über Listen-Endpunkt) | — |
| `POST /api/v1/customers/{customer_id}/construction-sites` | **Nur Variante A:** portal-angelegte Baustelle als neuen Lieferort in CoTraS anlegen; Antwort HTTP 201 mit der vom ERP vergebenen stabilen `site_id` (synchron). Der Shop überträgt asynchron — die Bestellung wartet nie auf den ERP-Roundtrip. Idempotenz über `portal_reference` | — |

#### Feldliste

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `site_id` | string | MUSS | Stabile, nie wiederverwendete Baustellen-ID — Upsert-Schlüssel und Referenz an Auftrag und Rechnung. Bei POST: vom ERP vergeben, synchron zurückgegeben |
| `customer_id` | string | MUSS | ERP-Kundennummer des Inhabers (identisch mit Kundenstamm, Welle 1) — bestimmt die Sichtbarkeit im Portal, **sicherheitskritisch für die Mandantentrennung** |
| `name` | string | MUSS | Bezeichnung („Neubau Bürokomplex Leipziger Straße") — Anzeige-/Auswahlfeld. Lesen + Schreiben |
| `street` | string | MUSS | Straße. Lesen + Schreiben; ERP-geführtes Stammfeld (im Portal read-only bei ERP-Herkunft) |
| `house_number` | string | SOLL | Hausnummer getrennt von der Straße. Kombiniertes Feld akzeptabel — dann bitte dokumentieren. Neubaugebiete ohne Hausnummer: leer erlaubt |
| `postal_code` | string, 5-stellig | MUSS | PLZ — Grundlage der automatischen Transportzonen-Ermittlung; ohne PLZ fällt die Baustelle in den Anfrage-Modus ohne Preisanzeige |
| `city` | string | MUSS | Ort (korrekte Umlaute: „Crimmitschau", „Gößnitz") |
| `address_extra` | string \| null | KANN | Adresszusatz/Anfahrtshinweis aus dem ERP; portal-geführte Hinweise existieren zusätzlich und müssen nicht zurück ins ERP |
| `country` | string, ISO 3166-1 alpha-2 | KANN | Default DE — nur nötig bei Auslandsbaustellen |
| `status` | enum `aktiv` \| `abgeschlossen` | MUSS | Bestellflow zeigt standardmäßig nur aktive Baustellen; abgeschlossene bleiben Archiv. Andere ERP-Werte: dokumentiertes Mapping genügt. Statuswechsel müssen `updated_at` fortschreiben |
| `contact_name` | string \| null | SOLL | Ansprechpartner vor Ort. Datenminimierung: Name + Telefon genügen. Nur liefern, wenn strukturiert gepflegt |
| `contact_phone` | string \| null | SOLL | Telefonnummer des Ansprechpartners — für Fahrer/Disposition |
| `geo_lat` / `geo_lng` | number \| null, WGS84 | KANN | Koordinaten. Falls CoTraS keine führt: Portal ermittelt sie per Geocoding und führt sie portalseitig. Wünschenswert: POST akzeptiert portal-ermittelte Koordinaten (s. Fragen) |
| `portal_reference` | string (UUID) \| null | SOLL | Vom Portal beim POST mitgegebene UUID — Idempotenz (wiederholter POST erzeugt keine Dublette, sondern liefert dieselbe `site_id`) und Korrelation. Vom ERP unverändert gespeichert und in GET-Antworten zurückgeliefert |
| `is_deleted` | boolean | MUSS | Löschkennzeichen (Soft-Delete) im Delta- und Voll-Export; alternativ `deleted_at`-Zeitstempel |
| `updated_at` | string, ISO 8601 UTC | MUSS | Bei **jeder** Änderung fortgeschrieben — auch Statuswechsel und Setzen des Löschkennzeichens |
| `created_at` | string, ISO 8601 UTC | KANN | Anlagedatum — Sortierung und Alt-Baustellen-Abgrenzung beim Initial-Import |

#### Beispiel

```json
{
  "beispiel_get_liste": {
    "endpoint": "GET /api/v1/customers/K-10234/construction-sites?updated_since=2026-06-01T00:00:00Z",
    "response": {
      "server_time": "2026-07-03T06:15:00Z",
      "page": 1,
      "total_pages": 1,
      "total_count": 2,
      "construction_sites": [
        {
          "site_id": "BST-000482",
          "customer_id": "K-10234",
          "name": "Neubau Bürokomplex Leipziger Straße",
          "street": "Leipziger Straße",
          "house_number": "14a",
          "postal_code": "04600",
          "city": "Altenburg",
          "address_extra": "Zufahrt über Hofeinfahrt, Tor 2",
          "country": "DE",
          "status": "aktiv",
          "contact_name": "Jörg Münzner",
          "contact_phone": "+49 3447 512345",
          "geo_lat": 50.9857,
          "geo_lng": 12.4339,
          "portal_reference": null,
          "is_deleted": false,
          "created_at": "2026-03-02T09:15:00Z",
          "updated_at": "2026-06-28T14:32:10Z"
        },
        {
          "site_id": "BST-000391",
          "customer_id": "K-10234",
          "name": "Sanierung Mehrfamilienhaus Äußere Dresdner Straße",
          "street": "Äußere Dresdner Straße",
          "house_number": "7",
          "postal_code": "08451",
          "city": "Crimmitschau",
          "address_extra": null,
          "country": "DE",
          "status": "abgeschlossen",
          "contact_name": null,
          "contact_phone": null,
          "geo_lat": null,
          "geo_lng": null,
          "portal_reference": null,
          "is_deleted": false,
          "created_at": "2025-11-10T08:00:00Z",
          "updated_at": "2026-06-12T16:45:33Z"
        }
      ]
    }
  },
  "beispiel_post_anlage": {
    "endpoint": "POST /api/v1/customers/K-10234/construction-sites",
    "request": {
      "portal_reference": "7f3d2c9a-5b41-4e8a-9d27-0c6a1f8e2b55",
      "name": "Dachsanierung Grundschule Ponitz",
      "street": "Schulstraße",
      "house_number": "3",
      "postal_code": "04639",
      "city": "Ponitz",
      "address_extra": "Container bitte auf dem Lehrerparkplatz abstellen",
      "country": "DE",
      "contact_name": "Kerstin Großmann",
      "contact_phone": "+49 34496 78901",
      "geo_lat": 50.8621,
      "geo_lng": 12.4157
    },
    "response_201": {
      "site_id": "BST-000533",
      "customer_id": "K-10234",
      "portal_reference": "7f3d2c9a-5b41-4e8a-9d27-0c6a1f8e2b55",
      "status": "aktiv",
      "created_at": "2026-07-03T10:22:41Z",
      "updated_at": "2026-07-03T10:22:41Z"
    }
  }
}
```

#### Besondere Anforderungen

- **Konsistenz zu Welle 1:** Jede `customer_id` einer Baustelle muss über den Kundenstamm-Endpunkt auflösbar sein — verwaiste Referenzen brechen die Portal-Zuordnung. Erwartung: 1 Baustelle gehört genau 1 Kundennummer (falls nicht: bitte melden, das ändert das Sichtbarkeitsmodell).
- **Datenqualitäts-Toleranz:** Der Shop importiert auch unvollständige Bestandsbaustellen (fehlende Hausnummer, unbekannte PLZ) in einem Toleranzmodus — die API soll solche Datensätze **liefern statt wegfiltern**, damit der Bestand vollständig sichtbar ist.
- **Volumen:** Größenordnung (gesamt und je Kunde) bitte klären; ab ca. 500 Datensätzen pro Antwort Paginierung; ein lesender Status-Filter hilft, Alt-Datenvolumen beim Initial-Import zu begrenzen.
- Idempotenz beim POST (Variante A) über `portal_reference` — mindestens: dokumentiertes Verhalten bei Wiederholung.

---

### 3.4 Rechnungen / Belege (Welle 2)

#### Zweck

Registrierte Kunden sehen im Portal ihre Rechnungsliste (inklusive klar gekennzeichneter Gutschriften und Stornos) und laden Beleg-PDFs herunter. Der Shop hält einen entkoppelten **Metadaten**-Spiegel (Pull alle 15–60 Minuten, Upsert per stabiler Rechnungs-ID) und holt PDFs **on-demand beim ersten Kundenzugriff** (danach Cache mit 90 Tagen TTL nach letztem Zugriff — Belege müssen also wiederholt abrufbar sein). Der Auftrags-/Baustellenbezug ermöglicht den Rechnungsfilter je Baustelle und ist Andockpunkt für die spätere Wiegeschein-/Endabrechnungsanzeige.

**Rollenverteilung verbindlich:** CoTraS bleibt das revisionssichere Rechnungsarchiv (GoBD/§14b UStG, Aufbewahrungspflicht); der Shop ist reine Anzeige-Schicht mit löschbarem Cache. Die Schnittstelle ist **strikt read-only** — ausschließlich GET, keinerlei Schreib-, Korrektur- oder Archivfunktionen nötig.

#### Endpunkt-Vorschläge

| Endpunkt (Vorschlag) | Zweck | Delta/Parameter |
|---|---|---|
| `GET /api/v1/invoices` | Rechnungs-Metadaten-Liste als globaler Delta-Strom für den periodischen Pull und den nächtlichen Voll-Abgleich (alle Belegarten: Rechnung, Gutschrift, Storno). Filter `?customer_id=` für gezielte Einzel-Kunden-Abfragen (z. B. Nachladen nach Match-Freigabe). **Ein Pfad je Kunde (`/api/v1/customers/{id}/invoices`) ist nur dann semantisch gleichwertig, wenn ausschließlich verknüpfte Kunden gesynct werden** — für den globalen Delta-Strom und den nächtlichen Voll-Abgleich ist der globale Endpunkt nötig, sonst erzwingt ein Pro-Kunde-Endpunkt N Einzel-Requests und kann neue Belege noch nicht verknüpfter Kunden nicht liefern. Paginierung Pflicht | `?updated_since=<ISO 8601 UTC>&page=&page_size=` — liefert neue **und** geänderte Belege (inkl. Zahlstatus-Änderungen und nachträglichen Stornos); ohne `updated_since` = Vollabruf |
| `GET /api/v1/invoices/{invoice_id}` | Einzelbeleg-Metadaten — gezieltes Nachladen, Verifikation, Fehler-Retry | — |
| `GET /api/v1/invoices/{invoice_id}/document` | Beleg-PDF on-demand — Base64 im JSON-Envelope **oder** Binary mit `Content-Type: application/pdf` (Hess wählt, beides akzeptabel). Antwortzeit ≤ 5 s (P95) je Beleg — der Kunde wartet live. Fehlersemantik: 404 = kein Beleg vorhanden, 5xx = Archiv nicht erreichbar (Shop zeigt Retry-Meldung) | — |
| `GET /api/v1/invoices/{invoice_id}/e-invoice` | OPTIONAL (nur falls CoTraS E-Rechnungen erzeugt): strukturierte E-Rechnung (ZUGFeRD/Factur-X oder XRechnung-XML) zum Download | — |

#### Feldliste — Rechnungs-Metadaten

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `invoice_id` | string | MUSS | Stabile technische Beleg-ID; nie wiederverwendet, nie geändert — Upsert-Schlüssel |
| `invoice_no` | string | MUSS | Menschenlesbare Rechnungsnummer für Anzeige/Suche (falls identisch mit `invoice_id`: doppelt liefern) |
| `customer_id` | string | MUSS | ERP-Kundennummer — **muss dieselbe ID sein wie im Kundenstamm** (Welle 1), sonst keine Konto-Zuordnung und keine Anzeige |
| `invoice_type` | enum `invoice` \| `credit_note` \| `cancellation` | MUSS | Belegart — Gutschriften/Stornos werden im Portal klar gekennzeichnet angezeigt, nie unterdrückt |
| `invoice_date` | string, ISO-Datum | MUSS | Rechnungs-/Belegdatum |
| `due_date` | string, ISO-Datum \| null | MUSS | Fälligkeitsdatum; bei Gutschriften/Stornos null zulässig |
| `net_amount` | number, 2 Nachkommastellen | MUSS | Nettobetrag; bei Gutschrift/Storno negativ (Vorzeichenkonvention verbindlich festlegen) |
| `gross_amount` | number, 2 Nachkommastellen | MUSS | Bruttobetrag; Netto + USt = Brutto muss je Beleg exakt aufgehen |
| `updated_at` | string, ISO 8601 UTC | MUSS | Bei jeder Änderung fortgeschrieben (auch Zahlstatus-Wechsel und Storno-Setzung) — Grundlage des Delta-Syncs |
| `vat_rate` | number, Prozent | MUSS | USt-Satz des Belegs (z. B. 19.0) — ohne ihn ist die Konsistenzregel Netto + USt = Brutto nicht prüfbar |
| `vat_amount` | number, 2 Nachkommastellen | MUSS | USt-Betrag getrennt ausgewiesen — zusammen mit `vat_rate` Voraussetzung für die Konsistenzprüfung Netto + USt = Brutto; sonst müsste der Shop rückrechnen und riskiert Rundungsabweichungen |
| `is_voided` | boolean | MUSS | Löschkennzeichen für im ERP entfernte oder fehlerhaft erzeugte Belege (technischer Fehler) — **getrennt** vom fachlichen Storno (`invoice_type=cancellation`, s. o.), das ein gültiger, anzuzeigender Beleg bleibt. `is_voided=true` bedeutet: Beleg war nie gültig und wird aus der Anzeige entfernt |
| `currency` | string, ISO 4217 | SOLL | Falls nicht geliefert: Shop nimmt fix EUR an |
| `payment_status` | enum `open` \| `paid` \| `partly_paid` \| null | SOLL | Nur liefern, wenn in der Buchhaltung zeitnah gepflegt — der Shop blendet die Spalte sonst komplett aus; lieber kein Status als ein falscher |
| `order_id` | string \| null | SOLL | Strukturierter Auftragsbezug (stabile ID, konsistent zum Auftrags-Endpunkt) — Andockpunkt für Wiegeschein-/Endabrechnungsanzeige |
| `site_id` | string \| null | SOLL | Strukturierter Baustellenbezug (stabile ID, konsistent zum Baustellen-Endpunkt) — Voraussetzung für den Rechnungsfilter je Baustelle; Freitext genügt nicht |
| `related_invoice_id` | string \| null | SOLL | Bei Gutschrift/Storno: Referenz auf die Ursprungsrechnung — das Portal paart die Belege |
| `document_available` | boolean | SOLL | Ob ein PDF abrufbar ist — vermeidet Download-Buttons, die in 404 laufen |
| `subject` | string | KANN | Kurzbetreff/Leistungstext für die Liste; UTF-8 mit korrekten Umlauten |
| `paid_amount` / `payment_date` | number / string, Datum | KANN | Nur relevant, wenn `payment_status` geliefert wird (Teilzahlungsanzeige) |
| `site_label` | string \| null | KANN | Anzeigetext des Lieferorts als Fallback, falls (noch) keine strukturierte `site_id` existiert |
| `e_invoice_format` | enum `zugferd` \| `xrechnung` \| null | KANN | Kennzeichen, ob eine strukturierte E-Rechnung existiert (für den optionalen XML-Download) |

#### Feldliste — Beleg-Endpunkt (`/document`)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `content_base64` | string, Base64 | MUSS* | PDF Base64 im JSON-Envelope — *oder* alternativ Binary-Response mit `Content-Type: application/pdf`; eines von beiden ist Pflicht |
| `filename` + `mime_type` | string | SOLL | Sprechender Dateiname (z. B. `Rechnung_2026-004711.pdf`) und MIME-Type |
| `sha256` | string, hex | KANN | Prüfsumme für den Integritätscheck im Shop-Cache |

#### Beispiel

```json
{
  "GET /api/v1/invoices?customer_id=K-10234&updated_since=2026-06-01T00:00:00Z&page=1&page_size=500": {
    "items": [
      {
        "invoice_id": "RG-2026-004711",
        "invoice_no": "2026-004711",
        "invoice_type": "invoice",
        "customer_id": "K-10234",
        "invoice_date": "2026-06-12",
        "due_date": "2026-06-26",
        "net_amount": 215.11,
        "vat_rate": 19.0,
        "vat_amount": 40.87,
        "gross_amount": 255.98,
        "currency": "EUR",
        "is_voided": false,
        "payment_status": "open",
        "order_id": "A-2026-00912",
        "site_id": "BST-000482",
        "site_label": "Baustelle Heinrichstraße 24, 07545 Gera",
        "related_invoice_id": null,
        "document_available": true,
        "subject": "Containergestellung 7 m³ und Entsorgung Bauschutt gemäß Verwiegung (AVV 170107)",
        "e_invoice_format": "zugferd",
        "updated_at": "2026-06-12T09:41:03Z"
      },
      {
        "invoice_id": "GS-2026-000232",
        "invoice_no": "GS-2026-000232",
        "invoice_type": "credit_note",
        "customer_id": "K-10234",
        "invoice_date": "2026-06-24",
        "due_date": null,
        "net_amount": -23.50,
        "vat_rate": 19.0,
        "vat_amount": -4.47,
        "gross_amount": -27.97,
        "currency": "EUR",
        "is_voided": false,
        "payment_status": null,
        "order_id": "A-2026-00912",
        "site_id": "BST-000482",
        "site_label": "Baustelle Heinrichstraße 24, 07545 Gera",
        "related_invoice_id": "RG-2026-004711",
        "document_available": true,
        "subject": "Gutschrift Mengendifferenz nach Verwiegung zu Rechnung 2026-004711",
        "e_invoice_format": null,
        "updated_at": "2026-06-24T14:05:47Z"
      }
    ],
    "page": 1,
    "page_size": 500,
    "total_items": 2,
    "server_time": "2026-07-03T06:30:00Z"
  },
  "GET /api/v1/invoices/RG-2026-004711/document": {
    "invoice_id": "RG-2026-004711",
    "filename": "Rechnung_2026-004711.pdf",
    "mime_type": "application/pdf",
    "size_bytes": 148223,
    "sha256": "c8b1f0e2a94d7c3b5f6e8a1d2c4b7a9e0f3d5c7b9a1e3f5d7c9b1a3e5f7d9c1b",
    "content_base64": "JVBERi0xLjcKJcTl8uXrp/Og0MTGCiUgLi4uIChnZWvDvHJ6dCkgLi4u"
  }
}
```

#### Besondere Anforderungen

- **Stornos verschwinden nie:** Belege werden nie stillschweigend aus dem Feed entfernt — Stornos erscheinen als eigener Beleg (`invoice_type=cancellation`) bzw. als Kennzeichen mit Referenz auf den Ursprungsbeleg.
- **Historientiefe:** Initialer Full-Load ca. 24 Monate rückwirkend (finale Tiefe entscheidet Seyfarth); PDF-Abrufbarkeit sollte mindestens dieselbe Tiefe abdecken. Ältere Belege müssen nicht über die API bereitstehen.
- **DSGVO-Datenminimierung:** ausschließlich Kopf-/Metadaten je Beleg — **keine Rechnungspositionen, keine Bankverbindungen/Zahlwege des Kunden, keine Mahn-/Inkassodaten** über diese Schnittstelle.
- Rate-Limits insbesondere für den PDF-Abruf bitte dokumentieren; der Shop drosselt clientseitig.
- Der Read-Smoke gegen **Rechnungsliste und Beleg-PDF** ist das Go/No-Go-Gate für diesen Datenbereich, bevor Portal-UI-Arbeit beginnt.

---

### 3.5 Aufträge / Auftragsstatus / Wiegedaten (Welle 2)

#### Zweck

Drei aufeinander aufbauende Zwecke:

1. **Statusanzeige „Meine Aufträge"** im Portal (Statusfluss Erstellt → Bestätigt → Disponiert → In Ausführung → Abgeschlossen → Abgerechnet) und Vervollständigung des Bestellmodells „Endabrechnung nach Verwiegung" (Kunde sieht später Wiegeschein und Endpreis).
2. **DSGVO-Löschautomatik:** Das Statusereignis **„Abgeschlossen"** ist der verbindliche Trigger der 3-Monats-Löschfrist für Stellplatzfotos im Portal; Stornos/Wiedereröffnungen müssen die Frist zurücksetzen können. Deshalb muss der Abschluss als **dediziertes Feld** erkennbar sein — Ableitung aus Freitext genügt nicht.
3. **Wiegedaten-Erweiterung** (späterer Ausbau): Wiegescheine und Endabrechnung je Auftrag im Portal.

**Zwei getrennt lieferbare Ausbaustufen:**

- **Minimal-Variante (Kern, zuerst lieferbar):** nur lesende Status-/Wiegedaten-Endpunkte. Seyfarth erfasst Aufträge manuell in CoTraS und pflegt dabei die **Portal-Referenz** (`portal_referenz`, Format `SEY-ORD-YYYYMMDD-XXXXXXXX`) — dieses im ERP pflegbare Referenzfeld ist das Bindeglied: ohne es kann der Shop keinen Status einem Portal-Vorgang zuordnen.
- **Ausbau-Variante (optional zuschaltbar):** POST-Auftragsanlage Portal → ERP mit Positionen, Lieferadresse/Baustellenbezug, Geo-Koordinaten, Terminwunsch und Preis-Snapshot-Referenz.

Die Minimal-Variante muss **unabhängig** von der Ausbau-Variante funktionieren.

#### Endpunkt-Vorschläge

| Endpunkt (Vorschlag) | Variante | Zweck | Delta/Parameter |
|---|---|---|---|
| `GET /api/v1/orders` | Minimal | Auftragsliste als Delta-Strom für den Status-Spiegel, Filter nach Kunde | `?updated_since=<ISO 8601>&customer_id=&page=&limit=` — `updated_since` auf dem **technischen** Änderungszeitstempel, nicht nur fachlichen Datumsfeldern |
| `GET /api/v1/orders/{auftrag_id}` | Minimal | Einzelauftrag mit Positionen, Statusfeldern, optional eingebetteten Wiegungen und Endabrechnungs-Referenz | — |
| `GET /api/v1/orders/{auftrag_id}/status-history` | Minimal (SOLL) | Chronologische Statusereignisse inkl. Abgeschlossen, Storno, Wiedereröffnung — für Statushistorie und auditierbaren Löschfrist-Start. Alternativ akzeptabel: Historie als Array im Auftragsobjekt | `?since=<ISO 8601>` |
| `GET /api/v1/weighings` | Wiegedaten | Wiegedaten/Wiegescheine als eigener Delta-Strom (Wiegungen entstehen zeitlich nach dem Auftrag) | `?updated_since=&auftrag_id=&customer_id=` |
| `GET /api/v1/weighings/{wiegung_id}/document` | Wiegedaten (KANN) | Wiegeschein-PDF on-demand — gleiches Abrufmuster wie der Rechnungs-Beleg (Abschnitt 3.4) | — |
| `POST /api/v1/orders` | Ausbau | Auftragsanlage Portal → ERP: Positionen, strukturierte Lieferadresse oder `baustellen_id`, Geo, Terminwunsch, Bemerkung, `portal_referenz` als Idempotenzschlüssel. Antwort: stabile `auftrag_id` + Initialstatus (synchron bevorzugt; falls asynchron: Abruf-Endpunkt für das Anlage-Ergebnis definieren) | — |
| `POST /api/v1/orders/{auftrag_id}/cancel` | Ausbau (KANN) | Storno-Anstoß aus dem Portal. Alternativ bleibt Storno telefonisch/ERP-seitig und das Portal liest nur das Storno-Ereignis | — |

#### Feldliste — Auftrag (Lesestrecke, Minimal-Variante)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `auftrag_id` | string | MUSS | Stabile, nie wiederverwendete Auftrags-ID — Upsert-Schlüssel |
| `auftragsnummer` | string | SOLL | Menschenlesbare Belegnummer für Anzeige und Telefon-Rückfragen, falls abweichend |
| `customer_id` | string | MUSS | ERP-Kunden-ID, identisch mit Kundenstamm (Welle 1) — Kunde sieht nur eigene Aufträge |
| `portal_referenz` | string \| null | MUSS | Externes Referenzfeld für die Portal-Bestellnummer — **Bindeglied der Minimal-Variante**; im Ausbau vom POST gesetzt, in der Minimal-Variante von Seyfarth manuell gepflegt |
| `status` | enum, dokumentiert | MUSS | Stabile Werteliste, mindestens unterscheidbar: angelegt/bestätigt, disponiert, in Ausführung, abgeschlossen, storniert. Der Shop mappt auf den Portal-Statusfluss |
| `status_updated_at` | string, ISO 8601 mit Zeitzone | MUSS | Zeitpunkt der letzten Statusänderung |
| `abgeschlossen_am` | string \| null, ISO 8601 UTC | MUSS | Verbindlicher Abschluss-Zeitpunkt als **dediziertes Feld** — startet die 3-Monats-Foto-Löschfrist. **Reset-Semantik verbindlich:** Bei Wiedereröffnung wird `abgeschlossen_am` auf `null` gesetzt und `wiedereroeffnet_am` gesetzt; die Löschfrist beginnt erst mit dem **nächsten, neuen** `abgeschlossen_am` erneut zu laufen — nicht mit dem alten Wert |
| `storniert_am` | string \| null, ISO 8601 UTC | MUSS, sofern Stornos in CoTraS fachlich existieren | Storno-Kennzeichen mit Zeitpunkt; Aufträge werden nie hart gelöscht, sondern gekennzeichnet. Rechtlich an der Löschautomatik beteiligt — deshalb kein SOLL |
| `wiedereroeffnet_am` | string \| null, ISO 8601 UTC | MUSS, sofern Wiedereröffnungen in CoTraS fachlich existieren | Wiedereröffnung nach Abschluss/Storno. Siehe Reset-Semantik bei `abgeschlossen_am` — setzt die Foto-Löschfrist zurück, statt sie fortlaufen zu lassen |
| `is_deleted` | boolean | MUSS | Löschkennzeichen für Fehleingaben (technisch entfernte Aufträge) — **getrennt** vom fachlichen Storno (`storniert_am`), das ein gültiger, im Portal weiter sichtbarer Auftrag bleibt |
| `updated_at` | string, ISO 8601 UTC | MUSS | **Technischer** Änderungszeitstempel über alle Feldänderungen — Grundlage des Deltas |
| `gestellung_am` / `abholung_am` | string \| null, Datum | SOLL | Geplante/tatsächliche Gestellungs-/Abholtermine — so wird die Terminbestätigung der Disposition für den Kunden sichtbar |
| `baustellen_id` | string \| null | SOLL | Referenz auf ERP-Baustelle (gleiche ID wie Abschnitt 3.3) — Kosten-/Statuszuordnung je Baustelle |
| `lieferadresse` | object `{strasse, hausnummer, plz, ort}` | SOLL | Anzeige-Kontext, v. a. für manuell erfasste Aufträge ohne Portal-Ursprung. Keine weiteren Kontaktdaten nötig |
| `positionen[]` | object[] `{position_id, artikel_id, bezeichnung, avv, container_typ, menge, einheit}` | SOLL | Positionen mit stabiler `position_id` und `artikel_id` (identisch mit Katalog, Welle 1) — für aussagekräftige Anzeige und die Zuordnung von Wiegungen. Einheiten: t, m³, stueck |

#### Feldliste — Wiegedaten / Endabrechnung (Erweiterung)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `wiegung.wiegung_id` | string | MUSS | Stabile, nie wiederverwendete ID des Wiegevorgangs (Upsert-Schlüssel) |
| `wiegung.auftrag_id` | string | MUSS | Auftragsbezug |
| `wiegung.customer_id` | string | MUSS | ERP-Kundennummer, identisch mit Kundenstamm (Welle 1) — Basis für den Filter `?customer_id=` am eigenständigen Wiegungs-Endpunkt |
| `wiegung.wiege_datum` | string, Datum/ISO 8601 | MUSS | Datum der Verwiegung |
| `wiegung.updated_at` | string, ISO 8601 UTC | MUSS | Technischer Änderungszeitstempel — Grundlage des Deltas am eigenständigen Wiegungs-Endpunkt (`?updated_since=`); muss sich auch bei Korrekturen aktualisieren |
| `wiegung.netto_kg` | number | MUSS | Verwogene Nettomenge — Abrechnungsbasis der „Endabrechnung nach Verwiegung". Einheit fest dokumentieren (Vorschlag: kg als Ganzzahl) |
| `wiegung.is_corrected` | boolean | MUSS | Kennzeichen für nachträglich korrigierte Wiegungen (Fehlwiegungen sind an der Waage Alltag) — der Shop übernimmt nur die jeweils gültige Version, alte Werte werden nicht kommentarlos überschrieben |
| `wiegung.is_cancelled` | boolean | MUSS | Kennzeichen für stornierte/ungültige Wiegevorgänge — verhindert, dass eine falsche Verwiegung in die Endabrechnung einfließt |
| `wiegung.brutto_kg` / `wiegung.tara_kg` | number | SOLL | Brutto/Tara für Plausibilisierung und vollständige Wiegescheindarstellung |
| `wiegung.avv` / `wiegung.material` | string | SOLL | AVV-Schlüssel und Material der Verwiegung. **Wird MUSS, sobald ein Auftrag mehrere Abfallarten enthält** (sonst keine eindeutige Preiszuordnung) |
| `wiegung.position_id` | string \| null | SOLL | Zuordnung zur Auftragsposition |
| `wiegung.wiegeschein_nr` | string | SOLL | Menschenlesbare Wiegescheinnummer |
| `wiegung.dokument` | Base64/Binary, eigener Endpunkt | KANN | Wiegeschein-PDF on-demand (Muster wie Rechnungs-Beleg) |
| `endabrechnung.status` | enum `offen` \| `abgerechnet` | SOLL | Steuert die Anzeige „voraussichtlich" vs. „endgültig abgerechnet" |
| `endabrechnung.rechnung_id` | string \| null | SOLL | Referenz auf die ERP-Rechnung (gleiche ID wie Abschnitt 3.4) — bevorzugt gegenüber Betragsduplikaten am Auftrag: eine Quelle, keine Konsistenzkonflikte |
| `endabrechnung.netto_gesamt` / `ust_satz` / `brutto_gesamt` | number | KANN | Endbeträge direkt am Auftrag — nur falls der strukturierte Rechnungsbezug nicht lieferbar ist |

#### Feldliste — Auftragsanlage (POST, Ausbau-Variante)

| Feld | Typ | Pflicht | Beschreibung |
|---|---|---|---|
| `portal_referenz` | string | MUSS | Idempotenzschlüssel: erneuter POST mit gleicher Referenz erzeugt keinen zweiten Auftrag, sondern liefert die vorhandene `auftrag_id` |
| `customer_id` | string | MUSS | ERP-Kunden-ID des verknüpften Bestandskunden. Verhalten bei Portal-Neukunden ohne ERP-Kundennummer ist zu klären (s. Fragen) |
| `positionen[]` | object[] `{artikel_id, container_typ, menge, einheit}` | MUSS | Bestellpositionen mit Katalog-Artikel-ID (Welle 1), Containerart/-größe, Menge, Einheit |
| `lieferadresse` | object `{strasse, hausnummer, plz, ort}` | MUSS | Strukturierte, adressverifizierte Lieferadresse; alternativ `baustellen_id`, dann ist die Adresse im ERP führend |
| `terminwunsch_datum` / `terminwunsch_zeitfenster` | string, Datum / enum `vormittags` \| `nachmittags` \| `ganztags` | MUSS | Wunschtermin der Gestellung; die verbindliche Bestätigung kommt über die Lesestrecke (`gestellung_am`) zurück |
| `geo_lat` / `geo_lng` | number, WGS84, 6 Nachkommastellen | SOLL | Dedizierte Stellplatz-Koordinaten für die Disposition. Fallback bei fehlendem Feld: formatiert in `bemerkung` — dann ist die Bemerkung MUSS-Träger |
| `bemerkung` | string, Freitext, mind. ~500 Zeichen | MUSS | Freitext, der die Disposition zuverlässig erreicht: Stellplatzhinweise, Koordinaten-Fallback, Verpackungs-/Gefahrstoffhinweise, Zahlhinweis. **Keine Fotos ans ERP** (Datenminimierung — Fotos bleiben im Portal-Storage) |
| `baustellen_id` | string \| null | SOLL | Bezug auf bestehende ERP-Baustelle statt freier Adresse — eindeutige Zuordnung im ERP |
| `stellplatz` | enum `privat` \| `oeffentlich` | SOLL | Stellflächen-Angabe aus dem Konfigurator (Genehmigungs-/Sondernutzungshinweis) |
| `preisliste_version` / `positionen[].preis_netto_snapshot` | string / number | SOLL | Referenz des Preis-Snapshots der Portal-Kalkulation — **rein informativ** zur Abgleichbarkeit bei Reklamationen. Der Shop schreibt nie Preise ins ERP |
| `zahlart` | enum `vor_ort` \| `rechnung` | KANN | Gewünschte Zahlart aus dem Checkout, falls CoTraS sie am Auftrag führt |

#### Beispiel

```json
{
  "beispiel_1_statusabfrage": {
    "_endpunkt": "GET /api/v1/orders?updated_since=2026-08-20T00:00:00Z&customer_id=K-10234",
    "daten": [
      {
        "auftrag_id": "A-2026-00912",
        "auftragsnummer": "A-2026-00912",
        "customer_id": "K-10234",
        "portal_referenz": "SEY-ORD-20260810-7F3K9Q2M",
        "status": "abgeschlossen",
        "status_updated_at": "2026-08-21T14:32:00Z",
        "abgeschlossen_am": "2026-08-21T14:32:00Z",
        "storniert_am": null,
        "wiedereroeffnet_am": null,
        "updated_at": "2026-08-21T14:32:05Z",
        "gestellung_am": "2026-08-12",
        "abholung_am": "2026-08-20",
        "site_id": "BST-000482",
        "lieferadresse": { "strasse": "Gartenstraße", "hausnummer": "12", "plz": "04639", "ort": "Ponitz" },
        "positionen": [
          {
            "position_id": "AP-00912-1",
            "artikel_id": "ENT-170107",
            "bezeichnung": "Bauschutt rein, Absetzcontainer 5 m³",
            "avv": "170107",
            "container_typ": "Absetzcontainer 5 m³",
            "menge": 1,
            "einheit": "stueck"
          }
        ],
        "wiegungen": [
          {
            "wiegung_id": "WG-2026-04455",
            "wiegeschein_nr": "WS-33017",
            "wiege_datum": "2026-08-20",
            "avv": "170107",
            "material": "Bauschutt rein",
            "netto_kg": 3840,
            "brutto_kg": 12480,
            "tara_kg": 8640,
            "position_id": "AP-00912-1",
            "dokument_verfuegbar": true
          }
        ],
        "endabrechnung": {
          "status": "abgerechnet",
          "rechnung_id": "RE-2026-01831",
          "netto_gesamt": 194.24,
          "ust_satz": 19.0,
          "brutto_gesamt": 231.15,
          "waehrung": "EUR"
        }
      }
    ],
    "seite": 1,
    "weitere_seiten": false,
    "server_zeit": "2026-08-21T15:00:00Z"
  },
  "beispiel_2_auftragsanlage": {
    "_endpunkt": "POST /api/v1/orders (Ausbau-Variante)",
    "portal_referenz": "SEY-ORD-20260810-7F3K9Q2M",
    "customer_id": "K-10234",
    "baustellen_id": null,
    "lieferadresse": { "strasse": "Gartenstraße", "hausnummer": "12", "plz": "04639", "ort": "Ponitz" },
    "geo_lat": 50.859613,
    "geo_lng": 12.418205,
    "terminwunsch_datum": "2026-08-12",
    "terminwunsch_zeitfenster": "vormittags",
    "stellplatz": "privat",
    "preisliste_version": "PL-2026-04",
    "zahlart": "vor_ort",
    "positionen": [
      {
        "artikel_id": "ENT-170107",
        "container_typ": "Absetzcontainer 5 m³",
        "menge": 1,
        "einheit": "stueck",
        "preis_netto_snapshot": 23.50,
        "preis_einheit": "t"
      }
    ],
    "bemerkung": "Stellplatz: Einfahrt links neben der Garage, Zufahrt über Hofeinfahrt. Geo: 50.859613, 12.418205 (WGS84). Zahlung vor Ort nach Verwiegung.",
    "_antwort_beispiel": {
      "auftrag_id": "A-2026-00912",
      "status": "angelegt",
      "angelegt_am": "2026-08-10T09:14:00Z",
      "duplicate": false
    }
  },
  "beispiel_3_status_historie": {
    "_endpunkt": "GET /api/v1/orders/A-2026-00912/status-history",
    "ereignisse": [
      { "status": "angelegt", "updated_at": "2026-08-10T09:14:00Z" },
      { "status": "disponiert", "updated_at": "2026-08-11T08:00:00Z" },
      { "status": "in_ausfuehrung", "updated_at": "2026-08-12T07:30:00Z" },
      { "status": "abgeschlossen", "updated_at": "2026-08-21T14:32:00Z" }
    ]
  },
  "beispiel_4_wiegungen_eigener_delta_strom": {
    "_endpunkt": "GET /api/v1/weighings?updated_since=2026-08-20T00:00:00Z&customer_id=K-10234",
    "daten": [
      {
        "wiegung_id": "WG-2026-04455",
        "auftrag_id": "A-2026-00912",
        "customer_id": "K-10234",
        "wiege_datum": "2026-08-20",
        "netto_kg": 3840,
        "brutto_kg": 12480,
        "tara_kg": 8640,
        "avv": "170107",
        "material": "Bauschutt rein",
        "is_corrected": false,
        "is_cancelled": false,
        "wiegeschein_nr": "WS-33017",
        "updated_at": "2026-08-20T13:12:00Z"
      }
    ],
    "server_time": "2026-08-21T15:00:00Z"
  }
}
```

#### Besondere Anforderungen

- **Stabiles Statusmodell:** dokumentierte Werteliste; neue Statuswerte werden angekündigt statt still eingeführt. Storno und Wiedereröffnung sind eigene, per Delta erkennbare Zustandsübergänge (kein stilles Überschreiben) — eine Wiedereröffnung muss die Foto-Löschfrist im Portal zurücksetzen können.
- **Löschfrist-Trigger:** `abgeschlossen_am` als dediziertes Feld ist wegen der gesetzlich relevanten DSGVO-Löschautomatik verbindlich — es genügt nicht, den Abschluss aus dem Statuswert oder Freitext abzuleiten.
- **ID-Konsistenz:** `customer_id`, `artikel_id`, `baustellen_id` und `rechnung_id` referenzieren exakt dieselben stabilen IDs wie die jeweiligen Stammdaten-Endpunkte (ein gemeinsamer ID-Raum).
- **Fehlercodes für die Anlage:** 4xx-Antworten mit maschinenlesbarem, englischem Fehlercode nach dem Schema aus 2.8 und deutscher Klartextmeldung (z. B. `error.code = "UNKNOWN_CUSTOMER_ID"`, `error.code = "INVALID_ARTICLE_ID"`) — das Portal gibt fehlgeschlagene Anlagen in eine Nachbearbeitungs-Queue.
- **Volumen:** klein (regionaler Containerdienst); Delta alle 15–60 Minuten genügt, keine Echtzeit-/Webhook-Pflicht (Webhook-Option siehe 2.17). Listen paginiert (Vorschlag `limit` ≤ 500).
- **Datenminimierung:** Endpunkte liefern nur Aufträge des angefragten Kunden bzw. seit Zeitpunkt X; keine Übertragung von Stellplatzfotos ans ERP.

---

## 4 Offene Fragen an Hess

Die Fragen sind dedupliziert und nach Klärungsdringlichkeit gruppiert. Die Querschnittsfragen und die Welle-1-Fragen sollten im gemeinsamen Spezifikations-Review beantwortet werden; die Welle-2-Fragen können nachgelagert geklärt werden, beeinflussen aber Design-Entscheidungen, die jetzt schon mitgedacht werden sollten.

### 4.0 ★ KERNFRAGE — höchste Priorität, vor allen anderen Fragen

0. **Führt CoTraS kundenindividuelle Preise, Preislisten, Rabatte oder Sonderkonditionen?** Falls ja: Wie sind sie strukturiert (Preisgruppe am Kunden, individuelle Preisliste, Rabattstaffel auf die Standardpreise)? Wie sollen sie in der API abgebildet werden — ein `price_group`-Feld am Kunden (Abschnitt 3.1) oder ein eigener Endpunkt `GET /api/v1/customers/{customer_id}/prices`? **Diese Frage entscheidet über das gesamte Preis-Datenmodell des Katalog-Datenbereichs (Abschnitt 3.2) und sollte vor jeder weiteren Detailarbeit an Welle 1 beantwortet werden** — ohne Antwort sähen Bestandskunden im Portal ggf. falsche Preise.

### 4.1 Querschnitt (betrifft alle Datenbereiche — bitte zuerst klären)

1. **Auth:** Ist ein API-Key im Header umsetzbar, oder gibt es bereits eine OAuth2-/andere Auth-Infrastruktur? Ist Key-Rotation ohne Downtime möglich (zwei parallel gültige Keys im Übergangsfenster)?
2. **Hosting/Erreichbarkeit:** Wo wird die API betrieben (on-premise bei Seyfarth vs. Rechenzentrum)? Ist sie per HTTPS öffentlich erreichbar oder braucht es VPN/Tunnel? Gibt es eine statische Adresse/Domain mit gültigem TLS-Zertifikat?
3. **Delta-Mechanik:** Könnt ihr je Ressource ein zuverlässig gepflegtes Änderungsdatum anbieten, das **jede** Änderung anhebt — inklusive Statuswechsel, Setzen von Löschkennzeichen, reine Preisänderungen und Änderungen an Unterobjekten (z. B. Ansprechpartner/Lieferadressen am Kunden)? Oder ist ein zentrales Änderungsjournal mit Sequenznummer für euch einfacher? Falls keins von beiden: welche Vollexport-Frequenz ist zumutbar?
4. **Löschungen & ID-Stabilität:** Wie erscheinen gelöschte/deaktivierte Datensätze in der API (Statusfeld, `is_deleted`-Flag, `deleted_at`, Journal-Eintrag) — statt still zu verschwinden? Garantiert CoTraS, dass Kunden-, Artikel-, Baustellen-, Auftrags- und Rechnungsnummern **niemals wiederverwendet** werden?
5. **Zeichencodierung:** Liefert die CoTraS-Datenhaltung nativ UTF-8, oder findet eine Konvertierung (z. B. aus Latin-1/Windows-1252) statt? Können wir einen gemeinsamen Encoding-Testfall (Umlaute/ß) in die Abnahme aufnehmen? Kommen Zahlen als JSON-Werte mit Punkt-Dezimaltrenner statt deutsch formatierter Strings?
6. **Zeitzone:** Wir bitten um Zeitstempel in UTC mit Z-Suffix (siehe 2.9) — rechnet CoTraS intern mit Europe/Berlin, ist die Umrechnung auf UTC vor der Auslieferung machbar?
7. **Testsystem:** Ab wann steht eine Testinstanz mit anonymisierten/pseudonymisierten Daten und eigenen Credentials bereit — mit realistischer Datenvielfalt (Umlaute, Gefahrstoff-Artikel mit AVV-Stern, Dubletten, gelöschte Datensätze; für Welle 2 zusätzlich Statuswechsel, Stornos, Wiedereröffnungen, Wiegedaten, abrufbare Beleg-PDFs)? Diese Frage blockiert unser Go/No-Go und die Aufwandskalibrierung der Folge-Releases.
8. **Rate Limits & Wartung:** Welche Request-Limits gelten (insbesondere auch für PDF-Abrufe in Welle 2)? Sendet ihr bei 429 einen `Retry-After`-Header? Wie kündigt ihr Wartungsfenster an?
9. **Änderungspolitik & Spezifikation:** Wie kommuniziert ihr API-Änderungen (neue Felder, Breaking Changes, neue Version)? Könnt ihr eine OpenAPI-3.x-Spezifikation mit Beispiel-Payloads bereitstellen — idealerweise vor Entwicklungsstart zum Review?
10. **IP-Allowlist:** Könnt ihr den Zugriff auf die von uns benannten statischen Server-IPs einschränken (DEV + PROD, wir liefern die Adressen)?
11. **Idempotenz (Design-Vorsorge für Welle 2):** Könnt ihr bei künftigen Schreiboperationen eine client-vergebene externe Referenz bzw. einen Idempotency-Key als Unique-Schlüssel unterstützen und die erzeugte ERP-ID in der Antwort zurückgeben?
12. **Webhooks (Phase 2, unverbindlich):** Wäre ein signierter Push bei Auftragsstatus-Änderungen technisch denkbar, oder bleibt es dauerhaft bei Pull?

### 4.2 Welle 1 — Kundenstamm

13. Wie bildet CoTraS Zusammenführungen von Kunden-Dubletten ab — gibt es einen Verweis auf den führenden Satz (`merged_into`) zusätzlich zum Löschkennzeichen?
14. **E-Mail-Modell:** Gibt es ein oder mehrere E-Mail-Felder pro Kunde (inkl. Ansprechpartner-E-Mails)? Ist die E-Mail im ERP als eindeutig erzwungen, und welche Adresse gilt technisch als Haupt-/Match-Referenz?
15. Sind Adressen strukturiert gespeichert (Straße, Hausnummer, PLZ, Ort getrennt) oder als Freitext? Existieren abweichende Lieferadressen als eigene Objekte mit stabiler ID?
16. Ist die USt-ID ein eigenes, dediziertes Feld (ggf. formatgeprüft) — oder steht sie in Freitext-/Bemerkungsfeldern?
17. Welche Größenordnung hat der Kundenstamm (Anzahl Datensätze), und welche Paginierungs-Mechanik ist vorgesehen (Seiten/Cursor, maximale Seitengröße)?
18. Sind kundenindividuelle Zahlungskonditionen (Zahlungsziel etc.) strukturiert gepflegt — als Code, Referenz oder Freitext — und mit welchem Aufwand könnten sie im Kunden-Endpunkt mitgeliefert werden (alternativ erst in Welle 2)?

### 4.3 Welle 1 — Katalog & Preise

19. **Wichtige Weichenstellung (entscheidet den Zuschnitt von 3.2):** Sind die PLZ→Zone-Zuordnung (258 Einträge) und die Gestellungs-/Schüttgut-Lieferpreise je Zone und Fahrzeugart in CoTraS gepflegt und per API lieferbar — oder bleibt diese Matrix eine shopseitig gepflegte Preisliste unter dem in Abschnitt 3.2 beschriebenen Pflegeprozess? (Entscheidet, ob `/transport-zones` und `/transport-zones/locations` gebaut werden.)
20. Ist der ASN/AVV-Schlüssel inkl. \*-Gefahrstoffkennung als eigenes strukturiertes Feld gepflegt, oder steckt er nur im Artikeltext? Gibt es zusätzlich ein explizites Gefahrstoff-Flag?
21. Bearbeitungsgebühren (z. B. Asbest, Mineralwolle/KMF, teerhaltige Dachpappe): Sind sie Attribut am Abfall-Artikel oder eigene Artikel/Positionen — und falls eigene: über welches Feld ist die Verknüpfung zum Hauptartikel abbildbar?
22. Ist die Preiseinheit als strukturiertes Feld vorhanden (t / Stück / m³)? Welche Werte-Codes verwendet CoTraS dafür?
23. Ist der USt-Satz je Artikel als Feld gepflegt, und sind alle Preise in CoTraS durchgängig netto?
24. Gibt es Preisgültigkeiten (`gueltig_ab`/`gueltig_bis`) bzw. künftige Preisstände, oder ist immer nur der aktuell gültige Preis abrufbar?
25. Sind Containertypen (Art Absetzer/Abroller/Multicar, Volumen m³) als eigene Stammdaten-Entität mit stabiler ID abrufbar — oder existieren sie nur implizit in Artikel-/Preistexten?
26. Sind bei Baustoffen Kategorie, Material und Körnung strukturiert gepflegt oder Freitext in der Bezeichnung?
27. Kann jede Antwort eine Preisstands-/Versionskennung tragen (Feld `preisstand` oder eigener Endpunkt), damit der Shop konsistente, auditierbare Preislisten-Versionen bilden kann?

### 4.4 Welle 2 — Baustellen / Lieferorte

28. Existiert in CoTraS ein eigenständiges Baustellen-/Lieferort-Objekt mit stabiler, nie wiederverwendeter ID pro Kunde — oder sind Lieferorte nur Freitext-/Adresszeilen am Auftrag? (Entscheidet Variante A vs. B und die Aufwandsschätzung.)
29. Baut ihr eine Schreib-API (POST) für portal-angelegte Baustellen mit synchroner ID-Rückgabe? Falls die Anlage nur asynchron möglich ist: über welchen Weg erhält das Portal die endgültige ERP-ID (Status-Polling, Callback)?
30. Kann der POST eine `portal_reference` (UUID) entgegennehmen, speichern und in Lese-Antworten zurückliefern — als Dublettenschutz und zur Korrelation Portal ↔ ERP?
31. Falls keine Schreib-API kommt: Akzeptiert der Auftrags-Endpunkt einen vollständigen strukturierten Lieferort-Block (Bezeichnung, Straße, Hausnummer, PLZ, Ort, Ansprechpartner, optional Geo-Koordinaten)?
32. Welche Statuswerte führt CoTraS an Baustellen (nur aktiv/abgeschlossen oder weitere)?
33. Gibt es Geo-Koordinaten-Felder am Baustellen-Objekt? Falls nein: Können portal-ermittelte Koordinaten beim POST persistiert werden, oder bleiben sie rein portal-geführt?
34. Ist der Ansprechpartner vor Ort strukturiert gepflegt (Name und Telefon als getrennte Felder) oder Freitext — und hängt er am Baustellen-Objekt oder am Kunden?
35. Sind Baustellen-Adressen strukturiert gepflegt (Straße/Hausnummer getrennt, PLZ/Ort als eigene Felder), und sind PLZ + Ort als gefüllte Felder garantiert? (Die PLZ ist Grundlage unserer Zonen-Preislogik.)
36. Gilt strikt 1 Baustelle = 1 Kundennummer, oder kann eine Baustelle mehreren Kundennummern zugeordnet sein (z. B. Niederlassungen)? Das bestimmt unser Sichtbarkeits-/Mandantenmodell.
37. Welche Größenordnung hat der Baustellenbestand (gesamt und je Kunde), und kann lesend nach Status gefiltert werden, um Alt-Datenvolumen beim Initial-Import zu begrenzen?

### 4.5 Welle 2 — Rechnungen / Belege

38. Gibt es einen Rechnungs-Metadaten-Endpunkt (je Kunde oder gesamthaft mit Kunden-Filter) mit Delta und Paginierung — oder zunächst nur Vollexporte?
39. Ist der Beleg-PDF-Abruf on-demand je Einzelrechnung möglich (Base64 oder Binary)? Ist ≤ 5 s je Beleg realistisch, und wie weit zurück sind PDFs technisch abrufbar?
40. Wie werden Gutschriften und Stornos technisch abgebildet — eigener Belegtyp, Referenz auf den Ursprungsbeleg, negative Beträge?
41. Liefert die API einen Zahlstatus (offen/bezahlt/Teilzahlung), und führt eine Zahlstatus-Änderung zu einem aktualisierten Änderungszeitstempel?
42. Tragen Rechnungen einen strukturierten Auftrags- und Baustellen-/Lieferortbezug (stabile IDs, konsistent mit den Auftrags-/Baustellen-Endpunkten) oder nur Freitext?
43. Erzeugt CoTraS bereits E-Rechnungen (ZUGFeRD/Factur-X oder XRechnung) bzw. ist das geplant — und wäre das XML per API je Beleg abrufbar?
44. Welche Größenordnung an Rechnungen fällt an (pro Monat und als 24-Monats-Bestand)?

### 4.6 Welle 2 — Aufträge / Auftragsstatus / Wiegedaten

45. Welche Statuswerte kennt CoTraS je Auftrag (vollständige Werteliste), und welches Ereignis markiert verbindlich „Abgeschlossen"? Gibt es Storno und Wiedereröffnung als per API erkennbare Zustände?
46. Existiert ein **technischer** Änderungszeitstempel je Auftrag und je Wiegung (Basis für das Delta), oder nur fachliche Datumsfelder? Falls nein: Kann er ergänzt werden?
47. Gibt es am Auftrag ein pflegbares externes Referenzfeld (Portal-Bestellnummer), das auch bei manueller Erfassung durch Seyfarth-Mitarbeiter befüllt und per API gelesen werden kann? (Bindeglied der Minimal-Variante.)
48. Kann die API Aufträge anlegen (POST) — synchron mit ID-Rückgabe oder asynchron? Unterstützt sie Idempotenz über eine externe Referenz?
49. Setzt die Auftragsanlage einen bestehenden ERP-Kunden voraus, oder kann ein Auftrag mit Neukundendaten ohne Kundennummer angelegt werden? Falls Kundenanlage separat: über welchen Endpunkt?
50. Existieren dedizierte Geo-Koordinaten-Felder am Auftrag bzw. Lieferort (WGS84 Dezimalgrad)? Falls nein: Welches Bemerkungs-/Freitextfeld erreicht die Disposition zuverlässig, und wie lang darf es sein?
51. Sind Wiegedaten (netto/brutto/tara, Wiegedatum, AVV-/Material- und Positionsbezug) je Auftrag per API abrufbar? Können Wiegeschein-Dokumente einzeln als PDF abgerufen werden?
52. Wie ist die Endabrechnung je Auftrag abgebildet — als Beträge am Auftrag oder ausschließlich über die Rechnung? Ist der Auftrag→Rechnung-Bezug (`rechnung_id`) strukturiert vorhanden und per API lesbar?
53. Kann die Auftragsliste serverseitig nach Kunde und Änderungszeitpunkt gefiltert werden, und wie ist die Paginierung gestaltet?
54. **Terminwunsch:** Welches Format erwartet die Auftragsanlage (Datum plus freies oder enumeriertes Zeitfenster), und wird der von der Disposition bestätigte bzw. geänderte Termin als lesbares Feld am Auftrag zurückgegeben?

---

## 5 Vorgehensvorschlag

Wir schlagen folgendes gemeinsames Vorgehen vor — bewusst schlank, mit klaren Abnahmepunkten je Welle:

1. **Spezifikations-Review (gemeinsam):** Hess prüft diesen Katalog, beantwortet die offenen Fragen aus Kapitel 4 (mindestens Querschnitt + Welle 1) und meldet zurück, was in CoTraS bereits vorhanden ist, was mit vertretbarem Aufwand ergänzt werden kann und was anders geschnitten werden sollte. Endpunkt- und Feldnamen dürfen dabei gerne an die CoTraS-Konventionen angepasst werden — entscheidend ist die Semantik. Ergebnis: abgestimmte Spezifikation (idealerweise als OpenAPI-3.x-Dokument mit Beispiel-Payloads) und eine Aufwands-/Terminschätzung je Welle.

2. **Testzugang:** Hess stellt die Testinstanz mit anonymisierten Daten, eigenen Credentials und der abgestimmten Datenvielfalt bereit (siehe 2.13). Parallel baut VXD auf Basis der abgestimmten Spezifikation einen Mock-Adapter, sodass die Shop-Seite nicht auf die ERP-Entwicklung warten muss.

3. **Read-Smoke durch VXD (Go/No-Go):** VXD führt gegen das Testsystem einen strukturierten Lese-Smoke-Test durch: alle Welle-1-Endpunkte, Delta-Verhalten, Löschkennzeichen, Paginierung, Encoding-Testfall (Umlaute/ß), Fehlerformat, Healthcheck. Gefundene Abweichungen werden gemeinsam durchgesprochen und behoben. Erst ein bestandener Read-Smoke gibt die Produktivanbindung und die verbindliche Feature-Planung der Folge-Releases frei.

4. **Abnahme je Welle:**
   - **Welle 1 (Kundenstamm + Katalog/Preise):** Abnahme, sobald der zyklische Sync gegen das Produktivsystem über mehrere Tage stabil läuft (Delta + nächtlicher Voll-Abgleich, korrekte Umlaute, Tombstones, konsistenter Preisstand).
   - **Welle 2 (Baustellen + Rechnungen + Aufträge/Wiegedaten):** eigener Read-Smoke je Datenbereich (bei Rechnungen inklusive Beleg-PDF-Abruf, bei Aufträgen inklusive Statuswechsel/Storno/Wiedereröffnung im Testsystem), danach schrittweise Abnahme. Schreiboperationen (Baustellen-POST, Auftragsanlage) folgen jeweils erst nach stabiler Lesestrecke und werden separat abgenommen (Idempotenz-Test mit wiederholtem Request ist Teil der Abnahme).

Für Rückfragen zu diesem Katalog steht Vision X Digital jederzeit zur Verfügung; wir empfehlen als nächsten Schritt einen gemeinsamen Termin (Hess, Seyfarth, VXD) zur Durchsprache der Kernfragen — insbesondere Frage 19 (Zonen-Preismatrix), Frage 3 (Delta-Mechanik) und Frage 7 (Testsystem-Zeitpunkt), da diese den Projektzuschnitt und den Zeitplan bestimmen.