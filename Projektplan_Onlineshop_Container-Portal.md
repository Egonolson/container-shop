# Projektplan: B2B Onlineshop – Container- & Entsorgungsportal

**Single-Tenant Kundenportal | Erstellt am 12.02.2026**
**Erstellt für: Vision X Digital (Sebastian)**

---

## 1. Projektübersicht

### 1.1 Zielsetzung
Entwicklung eines B2B-Onlineshops für **einen Entsorgungs- und Schüttgut-Betrieb**, über den dessen Gewerbekunden rund um die Uhr Container-Services bestellen, Aufträge verwalten, Dokumente abrufen und Kosten auswerten können. Das Portal orientiert sich am Funktionsumfang von container-go.de, ist aber als Single-Tenant-Lösung für einen einzelnen Betreiber konzipiert.

### 1.2 Zwei Nutzergruppen

**Betreiber (Admin-Seite):**
Verwaltet Servicekatalog, Behältertypen, Abfallarten, Liefergebiete, Kunden, Dokumente und Aufträge. Sieht alle Bestellungen, kann Preise pflegen und Statusänderungen vornehmen.

**Gewerbekunden (Kunden-Seite):**
Bestellen Container-Services, verwalten ihre Lieferorte, sehen Rechnungen/Lieferscheine ein, nutzen Kostenübersichten und erfüllen Compliance-Anforderungen (GewAbfV).

---

## 2. Website-Struktur

### 2.1 Sitemap

```
Öffentlicher Bereich (Marketing-Website):
├── Startseite (Hero, Features, Vorteile, CTA)
├── Leistungen (Servicebeschreibung, Behältertypen, Abfallarten)
├── So funktioniert's (3-Schritte-Prozess, Screenshots)
├── Über uns (Team, Geschichte)
├── Kontakt (Formular, Ansprechpartner mit Foto)
├── FAQ
├── Impressum / Datenschutz / AGB

Portal (hinter Login):
├── Dashboard (KPIs, aktuelle Aufträge, Schnellaktionen)
├── Neuer Auftrag (Bestellprozess)
├── Meine Aufträge (Historie, Status, Filter)
├── Lieferorte (Verwaltung)
├── Dokumente (Rechnungen, Lieferscheine, Wiegescheine)
├── Kosten & Mengen (Statistiken, Abfallbilanz)
├── CO2-Report
├── GewAbfV-Dokumentation
├── Nachrichten (vom Betreiber)
├── Mein Konto / Benutzerverwaltung
└── Admin-Bereich (nur Betreiber)
```

---

## 3. Kunden-Funktionen im Detail

### 3.1 Modulübersicht

| Nr. | Modul | Was der Kunde damit tut | Priorität |
|-----|-------|------------------------|-----------|
| 1 | **Neuer Auftrag** | Containerbestellung aufgeben: Lieferort wählen, Behälter + Abfallart + Service (Stellen/Abholen/Wechseln) auswählen, Wunschtermin setzen | MUSS |
| 2 | **Meine Aufträge** | Alle Aufträge einsehen, Status tracken, nach Zeitraum/Ort/Status filtern | MUSS |
| 3 | **Auftragsvorlagen** | Wiederkehrende Bestellungen als Vorlage speichern, mit einem Klick nachbestellen | MUSS |
| 4 | **Lieferorte** | Eigene Lieferadressen/Baustellen anlegen und verwalten | MUSS |
| 5 | **Dokumente** | Rechnungen, Lieferscheine und Wiegescheine einsehen, filtern, als PDF laden | MUSS |
| 6 | **Kostenübersicht** | Kosten und Mengen nach Zeitraum und Lieferort auswerten, als Excel exportieren | MUSS |
| 7 | **Angebote** | Angebote vom Betreiber einsehen und annehmen | SOLL |
| 8 | **CO2-Reporting** | CO2-Einsparungen basierend auf Wertstoffen einsehen, PDF-Bescheinigung laden | SOLL |
| 9 | **GewAbfV** | Automatisierte Doku nach Gewerbeabfallverordnung, Begründungen hinterlegen | SOLL |
| 10 | **Nachrichten** | News und Mitteilungen vom Betreiber lesen | SOLL |
| 11 | **Benutzerverwaltung** | Mitarbeiter einladen, Rollen zuweisen (Admin, Besteller, Nur-Lesen) | MUSS |

### 3.2 Bestellprozess (Kern-Workflow)

```
1. Kunde loggt sich ein
2. Klickt "Neuer Auftrag" oder wählt Vorlage
3. Wählt Lieferort (aus gespeicherten oder legt neuen an)
4. Wählt Behältertyp (z.B. Absetzcontainer 7m³, Abrollcontainer 10m³)
5. Wählt Abfallart (z.B. Bauschutt, Holz, Mischmüll)
6. Wählt Auftragsart (Stellen / Abholen / Wechseln / Umladen)
7. Wählt Wunschtermin + Zeitfenster
8. Optionale Bemerkungen
9. Zusammenfassung + Bestätigung
10. → E-Mail-Bestätigung an Kunden
11. → Auftrag erscheint im Admin-Backend + optional ERP-Sync
```

### 3.3 Auftrags-Status-Flow

```
Erstellt → Bestätigt → Disponiert → In Ausführung → Abgeschlossen
                                                        ↓
                                                    Dokumentiert
                                                  (Lieferschein,
                                                   Wiegeschein)
```

### 3.4 Kundenrollen & Berechtigungen

| Rolle | Bestellen | Aufträge sehen | Dokumente | Kosten | Nutzer verwalten |
|-------|-----------|----------------|-----------|--------|-----------------|
| **Firmen-Admin** | Ja | Alle | Alle | Alle | Ja |
| **Besteller** | Ja | Eigene + Lieferort | Zugeordnete | Zugeordnete | Nein |
| **Nur-Lesen** | Nein | Alle | Alle | Alle | Nein |
| **Baustellen-Manager** | Ja | Nur eigener Lieferort | Nur eigener Lieferort | Nur eigener Lieferort | Nein |

---

## 3A. Erzeuger-Pflichten & Compliance im Bestellprozess

### 3A.1 Erweitertes Kundenprofil

Bei der Erstregistrierung oder nachträglichen Ergänzung muss das Kundenprofil folgende Felder unterstützen:

| Feld | Pflicht | Bedingung |
|------|---------|-----------|
| **Gewerbenachweis** (Upload) | Ja | Bei Erstregistrierung |
| **Erzeugernummer** (Behörde) | Bedingt | Pflicht wenn gefährliche Abfälle bestellt werden |
| **eANV-Vollmacht** (Upload + digitale Bestätigung) | Bedingt | Pflicht wenn Entsorger eANV-Vertretung übernimmt |
| **TRGS-519-Sachkundenachweis** (Upload) | Bedingt | Pflicht bei Asbest- oder KMF-Bestellungen |

### 3A.2 AVV-Abfallschlüssel-Zuordnung

Kein freies Textfeld — stattdessen ein geführter Auswahlprozess:

```
Auswahl-Flow:
1. Abfallkategorie wählen (z.B. "Bau- und Abbruchabfälle")
2. Abfallart wählen (z.B. "Beton, Ziegel, Fliesen")
3. AVV-Nummer wird automatisch zugeordnet (z.B. 17 01 01)
4. Klartextbeschreibung + Warnhinweise bei gefährlichen Abfallarten (*)
5. Gefährliche Abfälle (*) lösen zusätzliche Pflichtfelder aus
```

Die AVV-Datenbank wird als eigenes Datenmodell gepflegt:

```typescript
WasteCode {
  id: string
  avv_number: string          // z.B. "17 01 01"
  title: string               // z.B. "Beton"
  category: string            // z.B. "Bau- und Abbruchabfälle"
  is_hazardous: boolean       // Gefährlicher Abfall (*)
  requires_trgs519: boolean   // Asbest/KMF → Sachkundenachweis nötig
  description: string         // Klartext-Beschreibung
  warning_text: string        // Warnhinweis für Besteller
  is_active: boolean
}
```

### 3A.3 Conditional Checkout Flow (Bedingter Bestellprozess)

Je nach Abfallart werden unterschiedliche Pflichtfelder und Uploads eingeblendet:

| Abfallart | Zusätzliche Pflichten im Checkout |
|-----------|----------------------------------|
| **Normaler Bauschutt** (nicht gefährlich, sortenrein) | Keine zusätzlichen Felder |
| **Gemischter Gewerbeabfall** (AVV 17 09 04, 20 03 01 etc.) | GewAbfV-Erklärung: Begründung warum Trennung technisch nicht möglich oder wirtschaftlich unzumutbar. Ab Juli 2026: Fotodokumentation als Nachweis (Upload) |
| **Gefährliche Abfälle** (AVV mit *) | Erzeugernummer (Pflichtfeld), eANV-Vollmacht (Upload falls nicht vorhanden), Bestätigung Entsorgungsnachweis |
| **Asbest / KMF** (AVV 17 06 01*, 17 06 05*) | Alles von "Gefährliche Abfälle" PLUS TRGS-519-Sachkundenachweis (Upload, wird vor Bestellfreigabe geprüft) |

### 3A.4 GewAbfV-Erklärung im Bestellprozess

Bei gemischten Gewerbeabfällen muss der Besteller im Checkout:

1. Bestätigen, dass eine Getrennthaltung geprüft wurde
2. Begründung auswählen oder freitext eingeben:
   - "Technisch nicht möglich (Platzmangel auf der Baustelle)"
   - "Wirtschaftlich unzumutbar (Menge < 1m³ pro Fraktion)"
   - "Andere Begründung: [Freitext]"
3. **Ab Juli 2026 (GewAbfV-Novelle):** Foto-Upload als Nachweis der Gegebenheiten vor Ort

```
Datenmodell:
GewAbfVDeclaration {
  id: string
  order_id: string
  customer_id: string
  delivery_location_id: string
  avv_number: string
  is_separated: boolean
  justification_type: "technical" | "economic" | "other"
  justification_text: string
  photo_evidence_keys: string[]    // MinIO Storage Keys (ab Juli 2026)
  signed_at: Date
  year: number
}
```

### 3A.5 eANV-Vertretung & Digitale Signatur

- Bei gefährlichen Abfällen: rechtlich bindende Erklärung (mindestens Checkbox mit Rechtsbelehrung)
- Vollmacht für eANV-Vertretung durch den Entsorger: digitaler Upload + Bestätigung
- Langfristig: Integration qualifizierter elektronischer Signatur (z.B. via sign-me, Swisscom AIS)
- Begleitscheine und Entsorgungsnachweise werden dem Auftrag zugeordnet und revisionssicher archiviert

### 3A.6 TRGS-519-Prüfung (Asbest/KMF)

```
Prüf-Flow:
1. Kunde wählt Abfallart mit requires_trgs519 = true
2. System prüft: Hat der Kunde einen gültigen TRGS-519-Nachweis hinterlegt?
   → Ja: Bestellung kann fortgesetzt werden
   → Nein: Upload-Aufforderung, Bestellung blockiert bis Nachweis vorliegt
3. Admin kann Nachweis prüfen und freigeben
4. Nachweis wird mit Ablaufdatum gespeichert
```

---

## 4. Admin-Funktionen (Betreiber-Seite)

| Modul | Beschreibung |
|-------|-------------|
| **Auftragsverwaltung** | Alle eingehenden Aufträge sehen, Status ändern, Disposition |
| **Kundenverwaltung** | Firmen anlegen, Kundennummern zuweisen, Konditionen hinterlegen |
| **Servicekatalog** | Behältertypen, Abfallarten, Auftragsarten pflegen mit Bildern |
| **Preisgestaltung** | Preise pro Behälter/Abfallart, individuelle Kundenpreise |
| **Liefergebiete** | PLZ-Einzugsgebiete definieren, Vorlaufzeiten konfigurieren |
| **Dokumentenverwaltung** | Rechnungen, Lieferscheine, Wiegescheine hochladen und zuordnen |
| **Nachrichten** | News und Mitteilungen an Kunden senden |
| **Statistiken** | Umsatz, Auftragsvolumen, Top-Kunden, Abfallbilanzen |
| **ERP-Sync** | Synchronisations-Status, Fehlerlog, manuelle Sync-Auslösung |

---

## 5. Tech-Stack — Open-Source-Empfehlung

### 5.1 Bewertung der Open-Source-Optionen

Für diesen B2B-Onlineshop (Service-Bestellportal, kein klassischer Produktshop) kommen drei Ansätze in Frage:

#### Option A: Medusa.js v2 + Next.js (Empfohlen)

| Eigenschaft | Details |
|-------------|---------|
| **Plattform** | [Medusa.js v2](https://medusajs.com) – Open-Source Headless Commerce |
| **Sprache** | TypeScript / Node.js (Backend + Frontend gleiche Sprache) |
| **API** | REST + OpenAPI (auch JS SDK verfügbar) |
| **Warum ideal?** | Modulare Architektur — jedes Modul (Products, Orders, Customers) ist unabhängig und erweiterbar. Die Workflow-Engine erlaubt komplexe Bestellabläufe mit Rollback. Booking/Service-Rezepte in der Doku. Gutes Admin-Dashboard out-of-the-box. |
| **Anpassungen nötig** | Produkte = Services (Behälter + Abfallart), Custom Order-Workflow für Disposition, Termin-Picker, Lieferort-Modul als Custom Module |
| **Community** | Größte Community, 27k+ GitHub Stars, aktive Entwicklung |
| **Storefront** | Next.js Starter Storefront mitgeliefert |
| **Lizenz** | MIT (vollständig frei nutzbar, auch kommerziell) |

#### Option B: Vendure + Next.js/Remix

| Eigenschaft | Details |
|-------------|---------|
| **Plattform** | [Vendure](https://vendure.io) – Headless Commerce für B2B |
| **Sprache** | TypeScript / NestJS |
| **API** | GraphQL |
| **Warum gut?** | Speziell für B2B-Komplexität gebaut: Custom Pricing, Approval Chains, Order State Machine als Finite State Machine (perfekt für Auftrags-Status-Flow). Plugin-System für eigene Module. |
| **Anpassungen nötig** | Custom OrderProcess definieren, Product = Service Mapping, Storefront muss stärker angepasst werden (weniger poliert als Medusa) |
| **Community** | 6k+ GitHub Stars, solides Ökosystem |
| **Lizenz** | MIT |

#### Option C: Supabase + Next.js (Custom Build)

| Eigenschaft | Details |
|-------------|---------|
| **Plattform** | [Supabase](https://supabase.com) als Backend-Plattform |
| **Sprache** | TypeScript (Frontend), SQL + Edge Functions (Backend) |
| **API** | Auto-generierte REST + Realtime |
| **Warum?** | Maximale Flexibilität, kein E-Commerce-Framework nötig, alles maßgeschneidert. Auth, Database, Storage, Realtime out-of-the-box. Row-Level Security für Mandantentrennung. |
| **Nachteil** | Kein Shop-Framework → alles selbst bauen (Warenkorb, Checkout, Auftragsverwaltung, Admin-Panel). Deutlich mehr Entwicklungsaufwand. |
| **Community** | 75k+ GitHub Stars |
| **Lizenz** | Apache 2.0 |

### 5.2 Empfehlung: Medusa.js v2 + Next.js

Medusa v2 ist die beste Balance zwischen Out-of-the-box-Funktionalität und Anpassbarkeit für diesen Anwendungsfall:

- Die Workflow-Engine von Medusa v2 kann den kompletten Bestell-, Dispositions- und Dokumentations-Prozess abbilden.
- Produkte im Medusa-Sinn werden als Container-Services konfiguriert (Behältertyp × Abfallart × Auftragsart).
- Das Admin-Dashboard von Medusa kann für die Betreiber-Seite direkt genutzt werden.
- Der Next.js Storefront-Starter beschleunigt die Kunden-Frontend-Entwicklung.

### 5.3 Vollständiger Tech-Stack

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│   Cloudflare (DNS, CDN, DDoS-Schutz, SSL)            │
│                                                       │
├───────────────────────┬───────────────────────────────┤
│                       │                               │
│  Marketing-Website    │   Kunden-Portal (Shop)        │
│  ┌─────────────────┐  │   ┌────────────────────────┐  │
│  │ Next.js (SSG)   │  │   │ Next.js (SSR/CSR)      │  │
│  │ + Tailwind CSS   │  │   │ + Tailwind CSS          │  │
│  │ + shadcn/ui      │  │   │ + shadcn/ui             │  │
│  │                   │  │   │ + React Query           │  │
│  │ Seiten:           │  │   │ + Recharts (Charts)     │  │
│  │ - Startseite      │  │   │                          │  │
│  │ - Leistungen      │  │   │ Seiten:                  │  │
│  │ - Über uns        │  │   │ - Dashboard              │  │
│  │ - Kontakt         │  │   │ - Neuer Auftrag          │  │
│  │ - FAQ             │  │   │ - Auftragshistorie       │  │
│  └─────────────────┘  │   │ - Lieferorte             │  │
│                       │   │ - Dokumente              │  │
│                       │   │ - Kosten/Statistiken     │  │
│                       │   │ - CO2/GewAbfV            │  │
│                       │   │ - Benutzerverwaltung     │  │
│                       │   └────────────────────────┘  │
│                       │              │                 │
│                       │   ┌────────────────────────┐  │
│                       │   │  Medusa.js v2 Backend   │  │
│                       │   │  (Node.js / TypeScript)  │  │
│                       │   │                          │  │
│                       │   │  Module:                 │  │
│                       │   │  - Products (Services)   │  │
│                       │   │  - Orders (Aufträge)     │  │
│                       │   │  - Customers (B2B)       │  │
│                       │   │  - Custom: Lieferorte    │  │
│                       │   │  - Custom: Dokumente     │  │
│                       │   │  - Custom: GewAbfV       │  │
│                       │   │  - Custom: CO2-Report    │  │
│                       │   │  - Workflows Engine      │  │
│                       │   │                          │  │
│                       │   │  Medusa Admin Dashboard  │  │
│                       │   │  (Betreiber-Oberfläche)  │  │
│                       │   └────────────────────────┘  │
│                       │              │                 │
│          ┌────────────┼──────────────┼──────────┐     │
│          │            │              │          │     │
│   ┌────────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ │
│   │ PostgreSQL │ │  Redis  │ │  MinIO   │ │ SFTP  │ │
│   │            │ │         │ │ (S3-     │ │ (ERP- │ │
│   │ Datenbank  │ │ Cache + │ │ kompati- │ │ Sync) │ │
│   │ (Aufträge, │ │ Session │ │ bel für  │ │       │ │
│   │ Kunden,    │ │ + Event │ │ Doku-    │ │ XML/  │ │
│   │ Produkte)  │ │ Queue   │ │ mente)   │ │ CSV   │ │
│   └────────────┘ └─────────┘ └──────────┘ └───────┘ │
│                                                       │
│   Infrastruktur:                                      │
│   ┌─────────────────────────────────────────────────┐ │
│   │  Docker + Docker Compose                         │ │
│   │  Hetzner Cloud (Standort: DE, DSGVO-konform)     │ │
│   │  Traefik (Reverse Proxy + SSL via Let's Encrypt) │ │
│   │  GitHub Actions (CI/CD)                          │ │
│   │  Grafana + Prometheus (Monitoring)                │ │
│   │  Restic / Borgmatic (Backups)                     │ │
│   └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 5.4 Tech-Stack Tabelle

| Schicht | Technologie | Version | Lizenz | Zweck |
|---------|------------|---------|--------|-------|
| **Frontend** | Next.js | 15.x | MIT | Kunden-Portal + Marketing-Site |
| **UI-Framework** | Tailwind CSS + shadcn/ui | 4.x / latest | MIT | Styling + UI-Komponenten |
| **Charts** | Recharts | 2.x | MIT | Kosten-/Mengendiagramme |
| **Tabellen** | TanStack Table | 8.x | MIT | Auftrags- und Dokumententabellen |
| **PDF-Erzeugung** | @react-pdf/renderer | 4.x | MIT | CO2-Bescheinigung, GewAbfV-Ausdruck |
| **E-Commerce-Backend** | Medusa.js | 2.x | MIT | Orders, Products, Customers, Workflows |
| **Admin-Dashboard** | Medusa Admin | 2.x | MIT | Betreiber-Oberfläche |
| **Datenbank** | PostgreSQL | 16.x | PostgreSQL | Kern-Datenbank |
| **Cache/Queue** | Redis | 7.x | BSD | Session-Cache, Event-Queue |
| **Datei-Storage** | MinIO | latest | AGPLv3 | Dokumente (Rechnungen, Lieferscheine) |
| **Auth** | Medusa Auth (eingebaut) | - | MIT | Login, Rollen, B2B-Kundenkonten |
| **E-Mail** | Nodemailer + React Email | - | MIT | Auftragsbestätigungen, Einladungen |
| **E-Mail-Provider** | Mailgun oder Brevo (ex Sendinblue) | - | SaaS | Transaktionale E-Mails |
| **ERP-Sync** | Custom Node.js Service | - | Eigen | SFTP + XML/CSV Im-/Export |
| **Reverse Proxy** | Traefik | 3.x | MIT | Routing, SSL, Load Balancing |
| **Container** | Docker + Docker Compose | latest | Apache 2.0 | Deployment aller Services |
| **Hosting** | Hetzner Cloud (CPX31+) | - | - | DE-Standort, DSGVO-konform |
| **CI/CD** | GitHub Actions | - | - | Automatisierte Tests + Deployments |
| **Monitoring** | Grafana + Prometheus | - | AGPLv3 / Apache | Performance-Überwachung |
| **Backup** | Restic + B2 Storage | - | BSD | Tägliche verschlüsselte Backups |
| **DNS/CDN** | Cloudflare | Free/Pro | - | DDoS-Schutz, Caching, SSL |
| **Analytics** | Plausible oder Umami | - | AGPLv3/MIT | DSGVO-konforme Analytics (selbst gehostet) |
| **Cookie-Consent** | Klaro.js | - | MIT | Cookie-Banner ohne externe Dienste |

### 5.5 Warum Medusa.js v2 die richtige Wahl ist

**Was Medusa von Haus aus mitbringt (kein Eigenentwicklung nötig):**
- Produkt-/Servicekatalog mit Varianten (Behälter × Abfallart)
- Kundenverwaltung mit B2B-Firmenkonten
- Bestellprozess (Cart → Checkout → Order)
- Order-Management mit Status-Tracking
- Admin-Dashboard mit erweiterbarerer UI
- Preisgestaltung (auch kundenindividuelle Preislisten)
- Authentifizierung (Customer + Admin getrennt)
- Event-System (Webhooks bei Statusänderungen)
- Plugin-Architektur für Erweiterungen

**Was als Custom Module entwickelt werden muss:**
- Lieferort-Verwaltung (Custom Medusa Module mit eigenem Datenmodell)
- Termin-/Zeitfenster-Auswahl im Checkout
- Dokumenten-Center (Rechnungen, Lieferscheine an Orders anhängen)
- Kosten-/Mengenauswertung mit Charts
- CO2-Reporting-Modul
- GewAbfV-Dokumentationsmodul
- ERP-Sync-Service (Scheduled Job + SFTP)

---

## 6. Medusa Custom Modules — Detailplanung

### 6.1 Modul: Lieferorte (`delivery-locations`)

```typescript
// Datenmodell
DeliveryLocation {
  id: string
  customer_id: string       // Zuordnung zum B2B-Kunden
  name: string              // z.B. "Baustelle Hauptstraße 12"
  street: string
  zip_code: string
  city: string
  contact_person: string
  contact_phone: string
  notes: string
  is_active: boolean
  created_at: Date
}
```

- API-Routen: CRUD für Kunden + Admin
- Validierung: PLZ gegen konfigurierte Einzugsgebiete prüfen
- Duplikaterkennung auf Basis Straße + PLZ

### 6.2 Modul: Dokumente (`documents`)

```typescript
Document {
  id: string
  order_id: string          // Zuordnung zum Auftrag
  customer_id: string
  type: "invoice" | "delivery_note" | "weight_ticket" | "other"
  title: string
  file_key: string          // MinIO Storage Key
  file_size: number
  uploaded_at: Date
}
```

- Admin kann Dokumente zu Aufträgen hochladen
- Kunden sehen nur ihre eigenen Dokumente
- Filter nach Typ, Zeitraum, Lieferort

### 6.3 Modul: Statistiken (`statistics`)

- Aggregation aus Order-Daten: Kosten pro Zeitraum, Mengen pro Abfallart
- Gruppierung nach Lieferort möglich
- Excel-Export via `exceljs` Library
- CO2-Berechnung auf Basis konfigurierter Faktoren pro Wertstoffkategorie
- PDF-Bescheinigung via `@react-pdf/renderer`

### 6.4 Modul: GewAbfV (`gewabfv`)

```typescript
GewAbfVDeclaration {
  id: string
  customer_id: string
  delivery_location_id: string
  waste_type: string
  is_separated: boolean
  justification: string    // Begründung falls nicht getrennt
  supporting_doc_id: string // Optional: Nachweis-Dokument
  year: number
  created_at: Date
}
```

- Automatische Prüfung auf Basis deklarierter Abfälle pro Lieferort
- PDF-Ausdruck für Behördenkontrollen

### 6.5 Workflow: Auftragserstellung

```typescript
// Medusa v2 Workflow
createContainerOrderWorkflow
  ├── Step 1: validateDeliveryLocation  (PLZ im Einzugsgebiet?)
  ├── Step 2: validateAvailability      (Behälter + Termin verfügbar?)
  ├── Step 3: calculatePrice            (Kundenindividuell oder Standard)
  ├── Step 4: createOrder               (Medusa Order erstellen)
  ├── Step 5: sendConfirmationEmail     (E-Mail an Kunden)
  ├── Step 6: syncToERP                 (Optional: An ERP senden)
  └── Compensation: rollbackOrder       (Bei Fehler → alles rückgängig)
```

---

## 7. ERP-Schnittstelle

### 7.1 Architektur

```
Portal (Medusa) ←→ Sync-Service (Node.js) ←→ SFTP-Server ←→ ERP-System
                         │
                    Scheduled Job
                    (alle 5-15 Min.)
```

### 7.2 Datenaustausch

| Richtung | Daten | Format |
|----------|-------|--------|
| Portal → ERP | Neue Aufträge | XML |
| Portal → ERP | Neue Lieferorte | XML |
| ERP → Portal | Auftragsstatus-Updates | XML |
| ERP → Portal | Rechnungen / Lieferscheine | PDF (via SFTP) |
| ERP → Portal | Wiegedaten | XML/CSV |
| ERP → Portal | Preislisten / Stammdaten | XML/CSV |
| Portal → ERP | Kundenregistrierungen | XML |

### 7.3 Sicherheit
- SFTP mit SSH-Key-Authentifizierung
- SSL/TLS für alle API-Kommunikation
- Fehler-Logging und automatische Retry-Logik
- Admin-Dashboard zeigt Sync-Status und Fehler

---

## 8. Sicherheit & Compliance

### 8.1 DSGVO
- Hosting ausschließlich Hetzner DE (Nürnberg/Falkenstein)
- Selbst gehostete Analytics (Plausible/Umami) → kein Google Analytics nötig
- Cookie-Consent mit Klaro.js (Open Source, kein externer Dienst)
- Datenschutzerklärung + AGB + Impressum
- Recht auf Datenlöschung implementiert
- Verschlüsselung aller Daten in Transit (TLS) und at Rest (PostgreSQL Encryption)

### 8.2 Anwendungssicherheit
- Rate Limiting via Traefik
- CORS korrekt konfiguriert
- Input-Validierung auf allen API-Routen
- SQL-Injection-Schutz durch Medusa ORM (MikroORM)
- XSS-Schutz durch Next.js Server Components
- CSRF-Tokens für State-ändernde Requests
- Regelmäßige Dependency-Updates (Dependabot)

### 8.3 Branchen-Compliance
- GewAbfV-konforme Dokumentation
- CO2-Berichterstattung mit Bescheinigungen
- Revisionssichere Archivierung (Dokumente in MinIO mit Versionierung)

---

## 9. Projektphasen & Timeline

| Phase | Inhalt | Dauer |
|-------|--------|-------|
| **1. Konzeption & Design** | Requirements, Wireframes (Figma), Datenbankschema, Medusa-Modulplanung | 3-4 Wochen |
| **2. Infrastruktur** | Hetzner-Server, Docker-Setup, Traefik, PostgreSQL, Redis, MinIO, CI/CD | 1-2 Wochen |
| **3. Medusa Setup + Custom Modules** | Medusa v2 installieren, Servicekatalog konfigurieren, Custom Modules (Lieferorte, Dokumente, GewAbfV, Statistiken) entwickeln, Workflows implementieren | 6-8 Wochen |
| **4. Kunden-Frontend** | Next.js Storefront anpassen: Dashboard, Bestellprozess, Auftragshistorie, Dokumenten-Center, Kosten-Charts, CO2-Report, responsive Design | 6-8 Wochen |
| **5. Marketing-Website** | Startseite, Leistungen, Über uns, Kontakt, SEO, Cookie-Consent | 2-3 Wochen |
| **6. ERP-Integration** | SFTP-Sync-Service, XML-Import/Export, Fehlerhandling, Monitoring | 3-4 Wochen |
| **7. Testing & Go-Live** | E2E-Tests, Security-Check, Performance-Tests, Beta mit Pilotkunden, Go-Live | 2-3 Wochen |
| **Gesamt** | | **23-32 Wochen (ca. 6-8 Monate)** |

---

## 10. Kostenschätzung

### 10.1 Entwicklungskosten

| Posten | Geschätzt |
|--------|-----------|
| Konzeption & Design | 8.000 – 12.000 € |
| Infrastruktur-Setup | 3.000 – 5.000 € |
| Medusa Backend + Custom Modules | 25.000 – 40.000 € |
| Kunden-Frontend (Next.js) | 25.000 – 40.000 € |
| Marketing-Website | 5.000 – 10.000 € |
| ERP-Integration | 10.000 – 18.000 € |
| Testing & Go-Live | 5.000 – 8.000 € |
| **Gesamt Entwicklung** | **81.000 – 133.000 €** |

*Deutlich reduziert gegenüber Multi-Tenant-Variante, da kein White-Label-System, keine Mandantenverwaltung und kein Multi-Tenant-Overhead nötig.*

### 10.2 Laufende Kosten (monatlich)

| Posten | Kosten/Monat |
|--------|-------------|
| Hetzner Cloud (CPX31: 4 vCPU, 8GB RAM) | ca. 15 € |
| Hetzner Volume Storage (100GB für Dokumente) | ca. 5 € |
| Hetzner Backup Storage | ca. 3 € |
| Cloudflare (Free oder Pro) | 0 – 20 € |
| E-Mail-Versand (Brevo Free: 300/Tag) | 0 € |
| Domain + SSL | ca. 2 € |
| **Gesamt Infrastruktur** | **ca. 25 – 45 €/Monat** |
| Wartung & Updates (geschätzt) | 500 – 1.500 €/Monat |

*Der gesamte Stack ist Open Source und self-hosted — keine Lizenzgebühren, keine Transaktionsgebühren, keine Vendor-Lock-in.*

---

## 11. Docker-Deployment-Übersicht

```yaml
# docker-compose.yml — Vereinfachte Übersicht
services:
  traefik:          # Reverse Proxy + SSL
  medusa-backend:   # Medusa.js v2 API + Admin
  storefront:       # Next.js Kunden-Frontend
  marketing:        # Next.js Marketing-Website (oder im gleichen Projekt)
  postgres:         # PostgreSQL 16
  redis:            # Redis 7
  minio:            # MinIO Object Storage (Dokumente)
  erp-sync:         # Custom Node.js ERP-Sync Service
  grafana:          # Monitoring Dashboard
  prometheus:       # Metriken-Sammlung
```

Alle Services laufen als Docker-Container auf einem Hetzner-Server. Traefik übernimmt automatisches SSL via Let's Encrypt und routet Traffic an die richtigen Services.

---

## 12. Zusammenfassung

Dieses Projekt liefert einen vollwertigen **B2B-Onlineshop für Container- und Entsorgungsservices** mit dem Funktionsumfang von container-go.de — zugeschnitten auf einen einzelnen Betreiber und dessen Gewerbekunden.

**Kernvorteile des gewählten Tech-Stacks:**
- **100% Open Source** — keine Lizenzkosten, kein Vendor-Lock-in
- **Medusa.js v2** liefert E-Commerce-Grundfunktionen out-of-the-box (Produkte, Orders, Customers, Admin)
- **Custom Modules** decken branchenspezifische Anforderungen ab (Lieferorte, Dokumente, GewAbfV, CO2)
- **Next.js + Tailwind** für ein modernes, schnelles Frontend
- **Hetzner + Docker** für günstiges, DSGVO-konformes Hosting (unter 50 €/Monat)
- **ERP-Anbindung** über standardisierte SFTP/XML-Schnittstelle
- **Erweiterbar:** Bei Bedarf kann das System später für weitere Mandanten ausgebaut werden

---

### Quellen — Open-Source-Plattformen

- [Medusa.js v2 — Open Source Headless Commerce](https://medusajs.com)
- [Vendure — Enterprise Headless E-Commerce](https://vendure.io)
- [Saleor — Open Source Headless E-Commerce](https://saleor.io)
- [Vergleich: Medusa vs Saleor vs Vendure](https://www.linearloop.io/blog/medusa-js-vs-saleor-vs-vendure)
- [Medusa Workflow Engine Dokumentation](https://docs.medusajs.com/resources/infrastructure-modules/workflow-engine)
- [Medusa Booking System Recipe](https://medusajs.com/blog/booking-system/)

---

*Erstellt von Claude für Vision X Digital – 12.02.2026*
