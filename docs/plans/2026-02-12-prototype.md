# ContainerShop Prototype Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Lauffähiger Prototyp eines B2B-Container-Bestellportals mit Medusa v2 Backend, Next.js Storefront und Docker-Deployment — demonstriert den kompletten Bestell-Workflow.

**Architecture:** Medusa.js v2 als Headless-Commerce-Backend mit Custom Modules (delivery-locations). Next.js 15 Storefront für Kunden-Login, Dashboard, Bestellprozess. Alles per Docker Compose orchestriert (PostgreSQL, Redis, Medusa, Storefront).

**Tech Stack:** Medusa.js v2, Next.js 15, Tailwind CSS, shadcn/ui, PostgreSQL 16, Redis 7, Docker Compose

**Prototype Scope (was NICHT enthalten ist):**
- Kein ERP-Sync, kein MinIO, kein Traefik, kein Monitoring
- Kein CO2-Reporting
- Keine Marketing-Website
- Keine E-Mail-Integration
- Keine qualifizierte elektronische Signatur (kommt Phase 2)
- Keine Fotodokumentation / Upload-Mechanismus (kommt Phase 2, GewAbfV-Novelle Juli 2026)
- Keine eANV-Integration / Begleitscheine (kommt Phase 2)
- Kein TRGS-519-Nachweis-Upload (kommt Phase 2)

**Was der Prototyp demonstriert:**
- Kunden-Login + Dashboard mit aktiven Aufträgen
- Servicekatalog (Behältertypen × Abfallarten als Medusa Products)
- **AVV-Abfallschlüssel**: Geführte Auswahl statt Freitext, mit Warnhinweisen bei gefährlichen Abfällen
- Lieferort-Verwaltung (Custom Module)
- **Conditional Checkout Flow**: Bestellprozess mit bedingten Pflichtfeldern je nach Abfallart
  - Normaler Bauschutt: keine Zusatzfelder
  - Gemischter Gewerbeabfall: GewAbfV-Erklärung (Begründung Nicht-Trennung)
  - Gefährliche Abfälle: Erzeugernummer-Pflichtfeld + Vollmacht-Checkbox
  - Asbest/KMF: Hinweis "TRGS-519 erforderlich" (Upload kommt Phase 2)
- **Erweitertes Kundenprofil**: Erzeugernummer, Gewerbenachweis-Status
- Auftragshistorie mit Status-Tracking
- Admin-Dashboard (Medusa Admin) für Auftragsverwaltung

---

## Task 1: GitHub Repo klonen und Projektstruktur anlegen

**Files:**
- Create: `docker-compose.yml`
- Create: `.env`
- Create: `.gitignore`
- Create: `README.md`

**Step 1: Repo klonen**

```bash
cd /Users/sebastianhendrich/ContainerShop
git remote add origin https://github.com/Egonolson/container-shop.git || true
```

**Step 2: .gitignore erstellen**

```gitignore
node_modules/
.env
.env.local
dist/
.medusa/
.next/
postgres_data/
redis_data/
```

**Step 3: .env erstellen**

```env
# Medusa Backend
MEDUSA_ADMIN_EMAIL=admin@container-shop.local
MEDUSA_ADMIN_PASSWORD=supersecret123
DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa-store
REDIS_URL=redis://redis:6379
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8000,http://localhost:9000
COOKIE_SECRET=prototype-cookie-secret-change-in-prod
JWT_SECRET=prototype-jwt-secret-change-in-prod

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=medusa-store
```

**Step 4: docker-compose.yml erstellen**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: containershop-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: containershop-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Step 5: Commit**

```bash
git add .gitignore .env docker-compose.yml CLAUDE.md docs/
git commit -m "chore: initial project structure with Docker Compose"
```

---

## Task 2: Medusa v2 Backend erstellen

**Files:**
- Create: `backend/` (via `create-medusa-app`)
- Modify: `docker-compose.yml` (Medusa-Service hinzufügen)

**Step 1: Medusa-Projekt erstellen**

```bash
cd /Users/sebastianhendrich/ContainerShop
npx create-medusa-app@latest backend --skip-db --no-browser
```

Falls interaktiv: Nur Backend wählen, kein Storefront (kommt separat).

**Step 2: Backend .env konfigurieren**

```bash
# backend/.env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/medusa-store
REDIS_URL=redis://localhost:6379
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8000,http://localhost:9000
COOKIE_SECRET=prototype-cookie-secret-change-in-prod
JWT_SECRET=prototype-jwt-secret-change-in-prod
```

**Step 3: Dockerfile für Backend erstellen**

```dockerfile
# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx medusa build

EXPOSE 9000

CMD ["npx", "medusa", "start"]
```

**Step 4: docker-compose.yml erweitern**

Zum bestehenden `docker-compose.yml` hinzufügen:

```yaml
  medusa:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: containershop-medusa
    depends_on:
      - postgres
      - redis
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/medusa-store
      REDIS_URL: redis://redis:6379
      STORE_CORS: http://localhost:8000
      ADMIN_CORS: http://localhost:9000
      AUTH_CORS: http://localhost:8000,http://localhost:9000
      COOKIE_SECRET: ${COOKIE_SECRET}
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./backend:/app
      - /app/node_modules
```

**Step 5: Lokal testen**

```bash
docker compose up -d postgres redis
cd backend && npm run dev
```

Erwartung: Medusa startet auf http://localhost:9000, Admin auf http://localhost:9000/app

**Step 6: Commit**

```bash
git add backend/ docker-compose.yml
git commit -m "feat: add Medusa v2 backend with Docker setup"
```

---

## Task 3: Servicekatalog als Medusa Products seeden

**Files:**
- Create: `backend/src/scripts/seed-services.ts`

**Step 1: Seed-Script erstellen**

Dieses Script erstellt die Container-Services als Medusa Products mit Varianten:

```typescript
// backend/src/scripts/seed-services.ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function seedServices({ container }: ExecArgs) {
  const productService = container.resolve("product")
  const regionService = container.resolve("region")
  const salesChannelService = container.resolve("sales_channel")

  // Region Deutschland erstellen
  const [region] = await regionService.createRegions([{
    name: "Deutschland",
    currency_code: "eur",
    countries: ["de"],
  }])

  // Sales Channel
  const [salesChannel] = await salesChannelService.createSalesChannels([{
    name: "Container-Portal",
    description: "B2B Kunden-Portal",
  }])

  // Behältertypen als Product Collections erstellen
  const containerTypes = [
    {
      title: "Absetzcontainer 3m³",
      description: "Kleiner Absetzcontainer für begrenzte Flächen",
      variants: [
        { title: "Bauschutt", prices: [{ amount: 28900, currency_code: "eur" }] },
        { title: "Mischmüll", prices: [{ amount: 34900, currency_code: "eur" }] },
        { title: "Holz (A1-A3)", prices: [{ amount: 24900, currency_code: "eur" }] },
        { title: "Grünschnitt", prices: [{ amount: 19900, currency_code: "eur" }] },
      ]
    },
    {
      title: "Absetzcontainer 7m³",
      description: "Standard-Absetzcontainer für Baustellen",
      variants: [
        { title: "Bauschutt", prices: [{ amount: 38900, currency_code: "eur" }] },
        { title: "Mischmüll", prices: [{ amount: 44900, currency_code: "eur" }] },
        { title: "Holz (A1-A3)", prices: [{ amount: 34900, currency_code: "eur" }] },
        { title: "Sperrmüll", prices: [{ amount: 49900, currency_code: "eur" }] },
      ]
    },
    {
      title: "Abrollcontainer 10m³",
      description: "Großer Abrollcontainer für umfangreiche Projekte",
      variants: [
        { title: "Bauschutt", prices: [{ amount: 52900, currency_code: "eur" }] },
        { title: "Mischmüll", prices: [{ amount: 59900, currency_code: "eur" }] },
        { title: "Boden / Erdaushub", prices: [{ amount: 44900, currency_code: "eur" }] },
      ]
    },
    {
      title: "Abrollcontainer 20m³",
      description: "Extra-großer Abrollcontainer für Gewerbe",
      variants: [
        { title: "Mischmüll", prices: [{ amount: 79900, currency_code: "eur" }] },
        { title: "Holz (A1-A3)", prices: [{ amount: 64900, currency_code: "eur" }] },
        { title: "Gewerbeabfall", prices: [{ amount: 89900, currency_code: "eur" }] },
      ]
    },
  ]

  for (const ct of containerTypes) {
    await productService.createProducts([{
      title: ct.title,
      description: ct.description,
      status: "published",
      options: [{ title: "Abfallart", values: ct.variants.map(v => v.title) }],
      variants: ct.variants.map(v => ({
        title: v.title,
        options: { "Abfallart": v.title },
        prices: v.prices,
        manage_inventory: false,
      })),
      sales_channels: [{ id: salesChannel.id }],
    }])
  }

  console.log("Seed complete: Container-Services erstellt")
}
```

**Step 2: Seed ausführen**

```bash
cd backend
npx medusa exec src/scripts/seed-services.ts
```

**Step 3: Im Admin prüfen**

Öffne http://localhost:9000/app → Products → 4 Behältertypen mit Varianten sichtbar.

**Step 4: Commit**

```bash
git add backend/src/scripts/seed-services.ts
git commit -m "feat: add seed script for container service catalog"
```

---

## Task 4: Custom Module — Delivery Locations

**Files:**
- Create: `backend/src/modules/delivery-location/models/delivery-location.ts`
- Create: `backend/src/modules/delivery-location/service.ts`
- Create: `backend/src/modules/delivery-location/index.ts`
- Modify: `backend/medusa-config.ts` (Modul registrieren)

**Step 1: Datenmodell erstellen**

```typescript
// backend/src/modules/delivery-location/models/delivery-location.ts
import { model } from "@medusajs/framework/utils"

const DeliveryLocation = model.define("delivery_location", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  name: model.text(),
  street: model.text(),
  zip_code: model.text(),
  city: model.text(),
  contact_person: model.text().nullable(),
  contact_phone: model.text().nullable(),
  notes: model.text().nullable(),
  is_active: model.boolean().default(true),
})

export default DeliveryLocation
```

**Step 2: Service erstellen**

```typescript
// backend/src/modules/delivery-location/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import DeliveryLocation from "./models/delivery-location"

class DeliveryLocationService extends MedusaService({
  DeliveryLocation,
}) {}

export default DeliveryLocationService
```

**Step 3: Modul-Definition erstellen**

```typescript
// backend/src/modules/delivery-location/index.ts
import { Module } from "@medusajs/framework/utils"
import DeliveryLocationService from "./service"

export const DELIVERY_LOCATION_MODULE = "delivery-location"

export default Module(DELIVERY_LOCATION_MODULE, {
  service: DeliveryLocationService,
})
```

**Step 4: In medusa-config.ts registrieren**

Zum `modules`-Array in `medusa-config.ts` hinzufügen:

```typescript
modules: [
  {
    resolve: "./src/modules/delivery-location",
  },
]
```

**Step 5: Migration generieren und ausführen**

```bash
cd backend
npx medusa db:generate delivery_location_setup
npx medusa db:migrate
```

**Step 6: Commit**

```bash
git add backend/src/modules/delivery-location/ backend/medusa-config.ts
git commit -m "feat: add delivery-location custom module"
```

---

## Task 5: API-Routen für Delivery Locations

**Files:**
- Create: `backend/src/api/store/delivery-locations/route.ts`
- Create: `backend/src/api/store/delivery-locations/[id]/route.ts`

**Step 1: CRUD-Routen erstellen**

```typescript
// backend/src/api/store/delivery-locations/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_LOCATION_MODULE } from "../../../modules/delivery-location"

// GET /store/delivery-locations — alle Lieferorte des eingeloggten Kunden
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const locations = await deliveryLocationService.listDeliveryLocations({
    customer_id: customerId,
    is_active: true,
  })

  res.json({ delivery_locations: locations })
}

// POST /store/delivery-locations — neuen Lieferort anlegen
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const customerId = req.auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const location = await deliveryLocationService.createDeliveryLocations({
    ...req.body,
    customer_id: customerId,
  })

  res.status(201).json({ delivery_location: location })
}
```

**Step 2: Einzelner Lieferort (GET, PUT, DELETE)**

```typescript
// backend/src/api/store/delivery-locations/[id]/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_LOCATION_MODULE } from "../../../../modules/delivery-location"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const location = await deliveryLocationService.retrieveDeliveryLocation(req.params.id)
  res.json({ delivery_location: location })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const location = await deliveryLocationService.updateDeliveryLocations({
    id: req.params.id,
    ...req.body,
  })
  res.json({ delivery_location: location })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  await deliveryLocationService.updateDeliveryLocations({
    id: req.params.id,
    is_active: false,
  })
  res.status(200).json({ success: true })
}
```

**Step 3: Testen**

```bash
# Health-Check
curl http://localhost:9000/store/delivery-locations -H "Authorization: Bearer <token>"
```

**Step 4: Commit**

```bash
git add backend/src/api/
git commit -m "feat: add store API routes for delivery locations"
```

---

## Task 5B: Custom Module — AVV Waste Codes (Abfallschlüssel)

**Files:**
- Create: `backend/src/modules/waste-code/models/waste-code.ts`
- Create: `backend/src/modules/waste-code/service.ts`
- Create: `backend/src/modules/waste-code/index.ts`
- Create: `backend/src/api/store/waste-codes/route.ts`
- Create: `backend/src/scripts/seed-waste-codes.ts`
- Modify: `backend/medusa-config.ts`

**Step 1: Datenmodell**

```typescript
// backend/src/modules/waste-code/models/waste-code.ts
import { model } from "@medusajs/framework/utils"

const WasteCode = model.define("waste_code", {
  id: model.id().primaryKey(),
  avv_number: model.text(),          // z.B. "17 01 01"
  title: model.text(),               // z.B. "Beton"
  category: model.text(),            // z.B. "Bau- und Abbruchabfälle"
  is_hazardous: model.boolean().default(false),
  requires_trgs519: model.boolean().default(false),
  description: model.text().nullable(),
  warning_text: model.text().nullable(),
  requires_gewabfv_declaration: model.boolean().default(false),
  is_active: model.boolean().default(true),
})

export default WasteCode
```

**Step 2: Service + Module Definition**

```typescript
// backend/src/modules/waste-code/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import WasteCode from "./models/waste-code"

class WasteCodeService extends MedusaService({ WasteCode }) {}
export default WasteCodeService
```

```typescript
// backend/src/modules/waste-code/index.ts
import { Module } from "@medusajs/framework/utils"
import WasteCodeService from "./service"

export const WASTE_CODE_MODULE = "waste-code"
export default Module(WASTE_CODE_MODULE, { service: WasteCodeService })
```

**Step 3: API-Route**

```typescript
// backend/src/api/store/waste-codes/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WASTE_CODE_MODULE } from "../../../modules/waste-code"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const wasteCodeService = req.scope.resolve(WASTE_CODE_MODULE)
  const category = req.query.category as string | undefined

  const filters: any = { is_active: true }
  if (category) filters.category = category

  const wasteCodes = await wasteCodeService.listWasteCodes(filters)
  res.json({ waste_codes: wasteCodes })
}
```

**Step 4: Seed-Script mit gängigen AVV-Nummern**

```typescript
// backend/src/scripts/seed-waste-codes.ts
import { ExecArgs } from "@medusajs/framework/types"

export default async function seedWasteCodes({ container }: ExecArgs) {
  const wasteCodeService = container.resolve("waste-code")

  const codes = [
    // Bau- und Abbruchabfälle (Kapitel 17)
    { avv_number: "17 01 01", title: "Beton", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Reiner Beton ohne Verunreinigungen" },
    { avv_number: "17 01 02", title: "Ziegel", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Ziegel und Mauerwerk" },
    { avv_number: "17 01 07", title: "Gemische aus Beton, Ziegel, Fliesen", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Gemischter Bauschutt (sortenrein mineralisch)" },
    { avv_number: "17 02 01", title: "Holz", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Unbehandeltes und behandeltes Holz (A1-A3)" },
    { avv_number: "17 02 04*", title: "Holz mit gefährlichen Stoffen", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_gewabfv_declaration: false, warning_text: "Gefährlicher Abfall — Erzeugernummer erforderlich. Entsorgungsnachweis wird benötigt.", description: "Holz A4 (z.B. Bahnschwellen, CKB-behandelt)" },
    { avv_number: "17 05 04", title: "Boden und Steine", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Erdaushub ohne gefährliche Stoffe" },
    { avv_number: "17 05 03*", title: "Boden mit gefährlichen Stoffen", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_gewabfv_declaration: false, warning_text: "Gefährlicher Abfall — Erzeugernummer + Analytik erforderlich.", description: "Kontaminierter Erdaushub" },
    { avv_number: "17 06 01*", title: "Dämmmaterial mit Asbest", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "ASBEST — TRGS 519 Sachkundenachweis erforderlich! Nur durch zugelassene Fachfirmen zu entsorgen.", description: "Asbesthaltige Baustoffe" },
    { avv_number: "17 06 05*", title: "Asbesthaltige Baustoffe", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "ASBEST — TRGS 519 Sachkundenachweis erforderlich!", description: "Asbest-Zementplatten, Eternit etc." },
    { avv_number: "17 06 03*", title: "KMF-Dämmstoffe", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "KMF — TRGS 519 Sachkundenachweis erforderlich!", description: "Künstliche Mineralfasern (alte Mineralwolle)" },
    { avv_number: "17 09 04", title: "Gemischte Bau- und Abbruchabfälle", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "Gemischter Gewerbeabfall — GewAbfV-Erklärung erforderlich (Begründung Nicht-Trennung).", description: "Baumischabfall (nicht sortenrein)" },
    // Siedlungsabfälle (Kapitel 20)
    { avv_number: "20 03 01", title: "Gemischte Siedlungsabfälle", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "Gemischter Gewerbeabfall — GewAbfV-Erklärung erforderlich.", description: "Gewerblicher Restmüll / Mischmüll" },
    { avv_number: "20 01 01", title: "Papier und Pappe", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Sortenrein gesammeltes Papier/Pappe" },
    { avv_number: "20 02 01", title: "Grünschnitt", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Garten- und Parkabfälle" },
    { avv_number: "20 03 07", title: "Sperrmüll", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "GewAbfV-Erklärung erforderlich bei gewerblicher Entsorgung.", description: "Sperrige Abfälle" },
  ]

  for (const code of codes) {
    await wasteCodeService.createWasteCodes({ ...code, is_active: true })
  }

  console.log(`Seed complete: ${codes.length} AVV-Abfallschlüssel erstellt`)
}
```

**Step 5: In medusa-config.ts registrieren, Migration, Seed**

```bash
npx medusa db:generate waste_code_setup
npx medusa db:migrate
npx medusa exec src/scripts/seed-waste-codes.ts
```

**Step 6: Commit**

```bash
git add backend/src/modules/waste-code/ backend/src/api/store/waste-codes/ backend/src/scripts/seed-waste-codes.ts backend/medusa-config.ts
git commit -m "feat: add AVV waste code module with seed data"
```

---

## Task 5C: Custom Module — GewAbfV Declarations

**Files:**
- Create: `backend/src/modules/gewabfv/models/gewabfv-declaration.ts`
- Create: `backend/src/modules/gewabfv/service.ts`
- Create: `backend/src/modules/gewabfv/index.ts`
- Create: `backend/src/api/store/gewabfv-declarations/route.ts`
- Modify: `backend/medusa-config.ts`

**Step 1: Datenmodell**

```typescript
// backend/src/modules/gewabfv/models/gewabfv-declaration.ts
import { model } from "@medusajs/framework/utils"

const GewAbfVDeclaration = model.define("gewabfv_declaration", {
  id: model.id().primaryKey(),
  order_id: model.text().nullable(),
  customer_id: model.text(),
  delivery_location_id: model.text(),
  avv_number: model.text(),
  is_separated: model.boolean().default(false),
  justification_type: model.text().nullable(),  // "technical" | "economic" | "other"
  justification_text: model.text().nullable(),
  signed_at: model.dateTime().nullable(),
  year: model.number(),
})

export default GewAbfVDeclaration
```

**Step 2: Service + Module**

```typescript
// backend/src/modules/gewabfv/service.ts
import { MedusaService } from "@medusajs/framework/utils"
import GewAbfVDeclaration from "./models/gewabfv-declaration"

class GewAbfVService extends MedusaService({ GewAbfVDeclaration }) {}
export default GewAbfVService
```

```typescript
// backend/src/modules/gewabfv/index.ts
import { Module } from "@medusajs/framework/utils"
import GewAbfVService from "./service"

export const GEWABFV_MODULE = "gewabfv"
export default Module(GEWABFV_MODULE, { service: GewAbfVService })
```

**Step 3: API-Route**

```typescript
// backend/src/api/store/gewabfv-declarations/route.ts
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GEWABFV_MODULE } from "../../../modules/gewabfv"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const gewabfvService = req.scope.resolve(GEWABFV_MODULE)
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const declarations = await gewabfvService.listGewAbfVDeclarations({
    customer_id: customerId,
  })
  res.json({ declarations })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const gewabfvService = req.scope.resolve(GEWABFV_MODULE)
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const declaration = await gewabfvService.createGewAbfVDeclarations({
    ...req.body,
    customer_id: customerId,
    signed_at: new Date(),
    year: new Date().getFullYear(),
  })
  res.status(201).json({ declaration })
}
```

**Step 4: Registrieren + Migration**

```bash
npx medusa db:generate gewabfv_setup
npx medusa db:migrate
```

**Step 5: Commit**

```bash
git add backend/src/modules/gewabfv/ backend/src/api/store/gewabfv-declarations/ backend/medusa-config.ts
git commit -m "feat: add GewAbfV declaration module for waste separation compliance"
```

---

## Task 6: Next.js Storefront erstellen

**Files:**
- Create: `storefront/` (via Next.js)
- Modify: `docker-compose.yml`

**Step 1: Next.js Projekt erstellen**

```bash
cd /Users/sebastianhendrich/ContainerShop
npx create-next-app@latest storefront --typescript --tailwind --app --src-dir --no-eslint
```

**Step 2: Dependencies installieren**

```bash
cd storefront
npm install @medusajs/js-sdk @tanstack/react-query lucide-react
npx shadcn@latest init -d
npx shadcn@latest add button card input label select dialog table badge separator sheet
```

**Step 3: Medusa SDK konfigurieren**

```typescript
// storefront/src/lib/medusa.ts
import Medusa from "@medusajs/js-sdk"

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
})
```

**Step 4: Environment-Variablen**

```env
# storefront/.env.local
NEXT_PUBLIC_MEDUSA_URL=http://localhost:9000
```

**Step 5: Dockerfile für Storefront**

```dockerfile
# storefront/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000
CMD ["npm", "run", "dev", "--", "-p", "8000"]
```

**Step 6: docker-compose.yml erweitern**

```yaml
  storefront:
    build:
      context: ./storefront
      dockerfile: Dockerfile
    container_name: containershop-storefront
    depends_on:
      - medusa
    ports:
      - "8000:8000"
    environment:
      NEXT_PUBLIC_MEDUSA_URL: http://medusa:9000
    volumes:
      - ./storefront:/app
      - /app/node_modules
      - /app/.next
```

**Step 7: Commit**

```bash
git add storefront/ docker-compose.yml
git commit -m "feat: add Next.js storefront with Medusa SDK"
```

---

## Task 7: Kunden-Auth (Login/Register)

**Files:**
- Create: `storefront/src/lib/auth.tsx` (Auth-Context)
- Create: `storefront/src/app/login/page.tsx`
- Create: `storefront/src/app/(portal)/layout.tsx` (geschütztes Layout)

**Step 1: Auth-Context mit Medusa SDK**

```typescript
// storefront/src/lib/auth.tsx
"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { medusa } from "./medusa"

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
}

interface AuthContextType {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medusa.store.customer.retrieve()
      .then(({ customer }) => setCustomer(customer))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    await medusa.auth.login("customer", "emailpass", { email, password })
    const { customer } = await medusa.store.customer.retrieve()
    setCustomer(customer)
  }

  const logout = async () => {
    await medusa.auth.logout()
    setCustomer(null)
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
```

**Step 2: Login-Page**

```typescript
// storefront/src/app/login/page.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      setError("Ungültige Anmeldedaten")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Container-Portal</CardTitle>
          <p className="text-center text-muted-foreground">Anmelden</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Anmelden</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Step 3: Geschütztes Portal-Layout**

```typescript
// storefront/src/app/(portal)/layout.tsx
"use client"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { customer, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !customer) router.push("/login")
  }, [loading, customer, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Laden...</div>
  if (!customer) return null

  return <>{children}</>
}
```

**Step 4: Commit**

```bash
git add storefront/src/
git commit -m "feat: add customer auth with login page and protected portal layout"
```

---

## Task 8: Kunden-Dashboard

**Files:**
- Create: `storefront/src/app/(portal)/dashboard/page.tsx`
- Create: `storefront/src/components/portal/sidebar.tsx`
- Create: `storefront/src/components/portal/portal-shell.tsx`

**Step 1: Portal-Shell mit Sidebar**

```typescript
// storefront/src/components/portal/sidebar.tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Plus, ClipboardList, MapPin, LogOut } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "Neuer Auftrag", icon: Plus },
  { href: "/orders", label: "Meine Aufträge", icon: ClipboardList },
  { href: "/locations", label: "Lieferorte", icon: MapPin },
]

export function Sidebar() {
  const pathname = usePathname()
  const { customer, logout } = useAuth()

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Container-Portal</h1>
        <p className="text-sm text-muted-foreground">{customer?.company_name}</p>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
            }`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" onClick={logout} className="justify-start gap-3">
        <LogOut className="h-4 w-4" /> Abmelden
      </Button>
    </aside>
  )
}
```

```typescript
// storefront/src/components/portal/portal-shell.tsx
import { Sidebar } from "./sidebar"

export function PortalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

**Step 2: Dashboard-Page**

```typescript
// storefront/src/app/(portal)/dashboard/page.tsx
"use client"
import { useEffect, useState } from "react"
import { medusa } from "@/lib/medusa"
import { useAuth } from "@/lib/auth"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ClipboardList, MapPin, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const { customer } = useAuth()
  const [orders, setOrders] = useState([])
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    medusa.store.order.list({ limit: 5 })
      .then(({ orders, count }) => {
        setOrders(orders)
        setOrderCount(count)
      })
      .catch(() => {})
  }, [])

  return (
    <PortalShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">
            Willkommen, {customer?.first_name}
          </h2>
          <p className="text-muted-foreground">
            {customer?.company_name} — Übersicht
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/orders/new">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <Plus className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Neuer Auftrag</p>
                  <p className="text-sm text-muted-foreground">Container bestellen</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/orders">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <ClipboardList className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{orderCount} Aufträge</p>
                  <p className="text-sm text-muted-foreground">Alle anzeigen</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/locations">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Lieferorte</p>
                  <p className="text-sm text-muted-foreground">Verwalten</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Aufträge vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">#{order.display_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
```

**Step 3: Commit**

```bash
git add storefront/src/
git commit -m "feat: add customer dashboard with sidebar navigation"
```

---

## Task 9: Lieferort-Verwaltung (Frontend)

**Files:**
- Create: `storefront/src/app/(portal)/locations/page.tsx`
- Create: `storefront/src/components/portal/location-form.tsx`

**Step 1: Lieferorte-Seite mit Liste und Formular**

```typescript
// storefront/src/app/(portal)/locations/page.tsx
"use client"
import { useEffect, useState } from "react"
import { PortalShell } from "@/components/portal/portal-shell"
import { LocationForm } from "@/components/portal/location-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MapPin, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface DeliveryLocation {
  id: string
  name: string
  street: string
  zip_code: string
  city: string
  contact_person?: string
  contact_phone?: string
  notes?: string
}

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

export default function LocationsPage() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchLocations = async () => {
    const res = await fetch(`${API_URL}/store/delivery-locations`, { credentials: "include" })
    const data = await res.json()
    setLocations(data.delivery_locations || [])
  }

  useEffect(() => { fetchLocations() }, [])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchLocations()
  }

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/store/delivery-locations/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    fetchLocations()
  }

  return (
    <PortalShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lieferorte</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Neuer Lieferort</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Lieferort anlegen</DialogTitle>
              </DialogHeader>
              <LocationForm onSuccess={handleCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Lieferorte angelegt.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{loc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {loc.street}, {loc.zip_code} {loc.city}
                      </p>
                      {loc.contact_person && (
                        <p className="text-sm mt-1">Ansprechpartner: {loc.contact_person}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
```

**Step 2: Lieferort-Formular**

```typescript
// storefront/src/components/portal/location-form.tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

export function LocationForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", street: "", zip_code: "", city: "",
    contact_person: "", contact_phone: "", notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`${API_URL}/store/delivery-locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
    onSuccess()
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Bezeichnung *</Label>
        <Input required value={form.name} onChange={(e) => update("name", e.target.value)}
          placeholder="z.B. Baustelle Hauptstr. 12" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Straße *</Label>
          <Input required value={form.street} onChange={(e) => update("street", e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label>PLZ *</Label>
            <Input required value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
          </div>
          <div className="col-span-2">
            <Label>Ort *</Label>
            <Input required value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ansprechpartner</Label>
          <Input value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
        </div>
        <div>
          <Label>Telefon</Label>
          <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Anmerkungen</Label>
        <Input value={form.notes} onChange={(e) => update("notes", e.target.value)}
          placeholder="z.B. Zufahrt über Hofeingang" />
      </div>
      <Button type="submit" className="w-full">Lieferort anlegen</Button>
    </form>
  )
}
```

**Step 3: Commit**

```bash
git add storefront/src/
git commit -m "feat: add delivery location management UI"
```

---

## Task 10: Bestellprozess (Neuer Auftrag)

**Files:**
- Create: `storefront/src/app/(portal)/orders/new/page.tsx`

**Step 1: Mehrstufiges Bestellformular**

Das Bestellformular folgt dem Kern-Workflow:
1. Lieferort wählen
2. Behältertyp wählen
3. Abfallart wählen (= Produktvariante)
4. Auftragsart + Wunschtermin
5. Zusammenfassung + Bestätigung

```typescript
// storefront/src/app/(portal)/orders/new/page.tsx
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { medusa } from "@/lib/medusa"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

type Step = "location" | "container" | "waste" | "details" | "confirm"

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("location")
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Auswahl-State
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedVariant, setSelectedVariant] = useState<any>(null)
  const [orderType, setOrderType] = useState("stellen")
  const [desiredDate, setDesiredDate] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetch(`${API_URL}/store/delivery-locations`, { credentials: "include" })
      .then(r => r.json()).then(d => setLocations(d.delivery_locations || []))
    medusa.store.product.list({ limit: 20 })
      .then(({ products }) => setProducts(products))
  }, [])

  const handleConfirm = async () => {
    // Cart erstellen → Variante hinzufügen → Checkout
    const { cart } = await medusa.store.cart.create({})
    await medusa.store.cart.createLineItem(cart.id, {
      variant_id: selectedVariant.id,
      quantity: 1,
    })
    // Metadata für Lieferort + Auftragsart
    await medusa.store.cart.update(cart.id, {
      metadata: {
        delivery_location_id: selectedLocation.id,
        order_type: orderType,
        desired_date: desiredDate,
        notes,
      },
    })
    // Vereinfacht: direkt zur Auftragsübersicht
    router.push("/orders")
  }

  const steps: Record<Step, { title: string; next?: Step; prev?: Step }> = {
    location: { title: "1. Lieferort wählen", next: "container" },
    container: { title: "2. Behältertyp wählen", next: "waste", prev: "location" },
    waste: { title: "3. Abfallart wählen", next: "details", prev: "container" },
    details: { title: "4. Auftragsdetails", next: "confirm", prev: "waste" },
    confirm: { title: "5. Zusammenfassung", prev: "details" },
  }

  return (
    <PortalShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Neuer Auftrag</h2>

        {/* Progress */}
        <div className="flex gap-2">
          {Object.entries(steps).map(([key, s]) => (
            <Badge key={key} variant={step === key ? "default" : "outline"}>
              {s.title}
            </Badge>
          ))}
        </div>

        {/* Step: Lieferort */}
        {step === "location" && (
          <Card>
            <CardHeader><CardTitle>Lieferort wählen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {locations.map((loc: any) => (
                <div key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-4 border rounded-md cursor-pointer ${
                    selectedLocation?.id === loc.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                  }`}>
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-sm text-muted-foreground">{loc.street}, {loc.zip_code} {loc.city}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step: Behältertyp */}
        {step === "container" && (
          <Card>
            <CardHeader><CardTitle>Behältertyp wählen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {products.map((p: any) => (
                <div key={p.id}
                  onClick={() => { setSelectedProduct(p); setSelectedVariant(null) }}
                  className={`p-4 border rounded-md cursor-pointer ${
                    selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                  }`}>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step: Abfallart (Variante) */}
        {step === "waste" && selectedProduct && (
          <Card>
            <CardHeader><CardTitle>Abfallart wählen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {selectedProduct.variants?.map((v: any) => (
                <div key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`p-4 border rounded-md cursor-pointer flex justify-between ${
                    selectedVariant?.id === v.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                  }`}>
                  <p className="font-medium">{v.title}</p>
                  <p className="font-semibold">
                    {(v.calculated_price?.calculated_amount / 100).toFixed(2)} EUR
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Step: Details */}
        {step === "details" && (
          <Card>
            <CardHeader><CardTitle>Auftragsdetails</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Auftragsart</Label>
                <div className="flex gap-2 mt-1">
                  {["stellen", "abholen", "wechseln", "umladen"].map((t) => (
                    <Button key={t} variant={orderType === t ? "default" : "outline"}
                      onClick={() => setOrderType(t)} className="capitalize">
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Wunschtermin</Label>
                <Input type="date" value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label>Bemerkungen</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sonderwünsche, Zufahrtshinweise..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Bestätigung */}
        {step === "confirm" && (
          <Card>
            <CardHeader><CardTitle>Zusammenfassung</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <p className="text-muted-foreground">Lieferort:</p>
                <p>{selectedLocation?.name} — {selectedLocation?.city}</p>
                <p className="text-muted-foreground">Behälter:</p>
                <p>{selectedProduct?.title}</p>
                <p className="text-muted-foreground">Abfallart:</p>
                <p>{selectedVariant?.title}</p>
                <p className="text-muted-foreground">Auftragsart:</p>
                <p className="capitalize">{orderType}</p>
                <p className="text-muted-foreground">Wunschtermin:</p>
                <p>{desiredDate || "Kein Wunschtermin"}</p>
                {notes && <>
                  <p className="text-muted-foreground">Bemerkungen:</p>
                  <p>{notes}</p>
                </>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {steps[step].prev ? (
            <Button variant="outline" onClick={() => setStep(steps[step].prev!)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
            </Button>
          ) : <div />}
          {steps[step].next ? (
            <Button onClick={() => setStep(steps[step].next!)}
              disabled={
                (step === "location" && !selectedLocation) ||
                (step === "container" && !selectedProduct) ||
                (step === "waste" && !selectedVariant)
              }>
              Weiter <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleConfirm}>
              <Check className="h-4 w-4 mr-2" /> Auftrag bestätigen
            </Button>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
```

**Step 2: Commit**

```bash
git add storefront/src/
git commit -m "feat: add multi-step order creation wizard"
```

---

## Task 11: Auftragshistorie

**Files:**
- Create: `storefront/src/app/(portal)/orders/page.tsx`

**Step 1: Auftragsliste mit Status-Filter**

```typescript
// storefront/src/app/(portal)/orders/page.tsx
"use client"
import { useEffect, useState } from "react"
import { medusa } from "@/lib/medusa"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

const statusLabels: Record<string, string> = {
  pending: "Erstellt",
  confirmed: "Bestätigt",
  dispatched: "Disponiert",
  in_progress: "In Ausführung",
  completed: "Abgeschlossen",
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "secondary",
  dispatched: "secondary",
  in_progress: "default",
  completed: "default",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    medusa.store.order.list({ limit: 50, order: "-created_at" })
      .then(({ orders }) => setOrders(orders))
      .catch(() => {})
  }, [])

  return (
    <PortalShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Meine Aufträge</h2>
          <Link href="/orders/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Neuer Auftrag</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Noch keine Aufträge vorhanden.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Auftrag #{order.display_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("de-DE")} —{" "}
                      {order.items?.[0]?.title || "Container-Service"}
                    </p>
                    {order.metadata?.order_type && (
                      <p className="text-sm capitalize">Art: {order.metadata.order_type}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[order.status] || "outline"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">
                      {(order.total / 100).toFixed(2)} EUR
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
```

**Step 2: Commit**

```bash
git add storefront/src/
git commit -m "feat: add order history page with status badges"
```

---

## Task 12: Docker Compose finalisieren und testen

**Files:**
- Modify: `docker-compose.yml` (finale Version)
- Create: `backend/Dockerfile.dev`
- Create: `storefront/Dockerfile.dev`

**Step 1: Finale docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: containershop-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-medusa-store}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: containershop-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  medusa:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: containershop-medusa
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "9000:9000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@postgres:5432/medusa-store
      REDIS_URL: redis://redis:6379
      STORE_CORS: http://localhost:8000
      ADMIN_CORS: http://localhost:9000
      AUTH_CORS: http://localhost:8000,http://localhost:9000
      COOKIE_SECRET: ${COOKIE_SECRET:-prototype-secret}
      JWT_SECRET: ${JWT_SECRET:-prototype-jwt}
    volumes:
      - ./backend/src:/app/src

  storefront:
    build:
      context: ./storefront
      dockerfile: Dockerfile.dev
    container_name: containershop-storefront
    depends_on:
      - medusa
    ports:
      - "8000:3000"
    environment:
      NEXT_PUBLIC_MEDUSA_URL: http://localhost:9000
    volumes:
      - ./storefront/src:/app/src

volumes:
  postgres_data:
  redis_data:
```

**Step 2: Dev-Dockerfiles**

```dockerfile
# backend/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9000
CMD ["npm", "run", "dev"]
```

```dockerfile
# storefront/Dockerfile.dev
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Step 3: Alles hochfahren**

```bash
cd /Users/sebastianhendrich/ContainerShop
docker compose up -d --build
```

**Step 4: Prüfen**

- Medusa Admin: http://localhost:9000/app
- Storefront: http://localhost:8000
- API Health: `curl http://localhost:9000/health`

**Step 5: Commit + Push**

```bash
git add -A
git commit -m "feat: finalize Docker Compose for local prototype"
git push origin main
```

---

## Zusammenfassung der Prototyp-Architektur

```
┌─────────────────────┐     ┌─────────────────────┐
│  Next.js Storefront │     │  Medusa Admin        │
│  :8000              │     │  :9000/app           │
│                     │     │                      │
│  - Login            │     │  - Aufträge          │
│  - Dashboard        │◄───►│  - Produkte          │
│  - Neuer Auftrag    │     │  - Kunden            │
│  - Auftragshistorie │     │                      │
│  - Lieferorte       │     │                      │
└────────┬────────────┘     └────────┬─────────────┘
         │                           │
         └─────────┬─────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Medusa v2 API    │
         │  :9000            │
         │                   │
         │  Custom Modules:  │
         │  - delivery-loc.  │
         └────────┬──────────┘
                  │
         ┌────────┴──────────┐
         │                   │
    ┌────▼─────┐  ┌──────────▼┐
    │PostgreSQL│  │   Redis    │
    │  :5432   │  │   :6379    │
    └──────────┘  └───────────┘
```
