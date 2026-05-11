# Seyfarth Container-Portal — Projektdokumentation

Stand: April 2026  
Erstellt von: Vision X Digital

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Systemarchitektur](#2-systemarchitektur)
3. [Server-Infrastruktur](#3-server-infrastruktur)
4. [Docker-Stack](#4-docker-stack)
5. [Cloudflare Tunnel & Domains](#5-cloudflare-tunnel--domains)
6. [Medusa Backend](#6-medusa-backend)
7. [Next.js Storefront](#7-nextjs-storefront)
8. [Produktkatalog](#8-produktkatalog)
9. [Design-System (Seyfarth CI)](#9-design-system-seyfarth-ci)
10. [Deployment-Workflow](#10-deployment-workflow)
11. [onepage.me Integration](#11-onepageme-integration)
12. [Alle URLs & Quicklinks](#12-alle-urls--quicklinks)
13. [Konfigurationsdateien](#13-konfigurationsdateien)
14. [Bekannte Einschränkungen & TODOs](#14-bekannte-einschränkungen--todos)

---

## 1. Projektübersicht

B2B-Online-Bestellportal für Container-Dienst Seyfarth GmbH. Gewerbekunden können Container direkt online bestellen (Stellen, Abholen, Wechseln), Abfallarten wählen und Lieferorte verwalten.

**Basis-Website:** https://containerdienst-seyfarth.onepage.me  
**Bestellportal DEV:** https://seyfarth-dev.visionmakegpt.work  
**Bestellportal PROD:** https://seyfarth.visionmakegpt.work  
**Embed-Katalog:** https://seyfarth.visionmakegpt.work/embed

**Tech-Stack:**
| Komponente | Technologie |
|---|---|
| E-Commerce Backend | Medusa.js v2 (TypeScript, MikroORM, PostgreSQL) |
| Storefront | Next.js 15 + Tailwind CSS 4 + shadcn/ui |
| Datenbank | PostgreSQL 16 |
| Cache | Redis 7 |
| Reverse Proxy | Nginx (Alpine) |
| Tunnel | Cloudflare Tunnel (cloudflared) |
| Hosting DEV | Hetzner Cloud hetzner-claw (46.225.135.138) |
| Hosting PROD | Hetzner Cloud hetzner-prod (91.99.210.56) |
| Containers | Docker Compose |

---

## 2. Systemarchitektur

```
Browser / onepage.me iframe
        |
        v
Cloudflare (DNS + Proxy)
        |
        v
Cloudflare Tunnel (cloudflared Container)
        |
        v
Nginx (Port 8092 → intern 80)
    |               |
    v               v
Next.js          Medusa API
Storefront       (Port 9000)
(Port 3000)          |
                     v
                PostgreSQL + Redis
```

**Routing in Nginx:**
- `/store/*` → Medusa Port 9000 (Store API)
- `/auth/*` → Medusa Port 9000 (Auth API)
- `/admin/*` → Medusa Port 9000 + statisches Admin-Build
- `/*` → Next.js Port 3000 (Storefront)

---

## 3. Server-Infrastruktur

### hetzner-claw (46.225.135.138) — DEV

SSH: `ssh hetzner-claw`  
Verzeichnis: `/opt/seyfarth/`  
Port: `8092`  
Tunnel: `seyfarth-dev` (ID: `3606f96e-3d34-45db-908d-c03ac979975b`)  
Credentials: `/opt/seyfarth/tunnel-credentials.json`

### hetzner-prod (91.99.210.56) — PROD

SSH: `ssh hetzner-prod`  
Verzeichnis: `/opt/seyfarth/`  
Port: `8092`  
Tunnel: `seyfarth-prod` (ID: `560dfa7a-b3b3-4626-b295-c5409996aaff`)  
Credentials: `/opt/seyfarth/tunnel-credentials.json`

**Wichtig:** Beide Server laufen mit identischer Konfiguration, unterscheiden sich nur in `.env` und Tunnel-Credentials. Kein anderer Container auf den Servern wird beeinflusst — vollständig isoliertes Netzwerk `seyfarth-net`.

---

## 4. Docker-Stack

Compose-Datei: `docker-compose.seyfarth.yml`

```
Container          Image                      Port (intern)
─────────────────────────────────────────────────────────
seyfarth-postgres  postgres:16-alpine         5432
seyfarth-redis     redis:7-alpine             6379
seyfarth-medusa    seyfarth-medusa:latest     9000
seyfarth-storefront seyfarth-storefront:latest 3000
seyfarth-nginx     nginx:alpine               80 → Host 8092
seyfarth-tunnel    cloudflare/cloudflared     —  (nur prod profile)
```

**Netzwerk:** `seyfarth-net` (bridge, isoliert)

**Volumes:**
- `seyfarth-postgres-data` — Datenbankdaten
- `seyfarth-redis-data` — Redis-Persistenz
- `seyfarth-admin-build` — Medusa Admin-Panel (statisch)

**Starten:**
```bash
# DEV
docker compose -f docker-compose.seyfarth.yml --env-file .env up -d

# PROD (mit Cloudflare Tunnel)
docker compose -f docker-compose.seyfarth.yml --env-file .env --profile prod up -d
```

---

## 5. Cloudflare Tunnel & Domains

### DEV (hetzner-claw)

| | |
|---|---|
| Domain | seyfarth-dev.visionmakegpt.work |
| Tunnel-Name | seyfarth-dev |
| Tunnel-ID | 3606f96e-3d34-45db-908d-c03ac979975b |
| Config | /opt/seyfarth/tunnel-config.yml |
| Credentials | /opt/seyfarth/tunnel-credentials.json |
| Container | seyfarth-tunnel (docker run, außerhalb Compose) |

Tunnel-Container manuell starten (falls nicht da):
```bash
docker run -d \
  --name seyfarth-tunnel \
  --network seyfarth-net \
  --restart unless-stopped \
  -v /opt/seyfarth/tunnel-config.yml:/etc/cloudflared/config.yml:ro \
  -v /opt/seyfarth/tunnel-credentials.json:/etc/cloudflared/tunnel-credentials.json:ro \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate --config /etc/cloudflared/config.yml run
```

### PROD (hetzner-prod)

| | |
|---|---|
| Domain | seyfarth.visionmakegpt.work |
| Tunnel-Name | seyfarth-prod |
| Tunnel-ID | 560dfa7a-b3b3-4626-b295-c5409996aaff |
| Config | /opt/seyfarth/tunnel-config.yml |
| Credentials | /opt/seyfarth/tunnel-credentials.json |
| Container | seyfarth-tunnel (via `--profile prod`) |

**Tunnel-Config (beide):**
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/tunnel-credentials.json
ingress:
  - hostname: seyfarth[-dev].visionmakegpt.work
    service: http://seyfarth-nginx:80
  - service: http_status:404
```

---

## 6. Medusa Backend

**Version:** Medusa.js v2  
**Port:** 9000 (intern)  
**Admin-Panel:** https://seyfarth.visionmakegpt.work/admin

### Publishable API Keys

| System | Token (pk_) |
|---|---|
| PROD | pk_dbb64ec2100a4e6bc878cedf6228fc0f4958646df961e72d5bae5349607dfbb2 |
| DEV | pk_5c82ab4f2ad9ccbe955d2c574249580d8d16b98dd5e3109d9f09cd57882d8b65 |

**Wichtig:** In Medusa gibt es zwei IDs pro API Key:
- `apk_...` = interne Datenbank-ID (nicht für API-Calls)
- `pk_...` = öffentlicher Token für API-Anfragen (dieser wird in Next.js gebaut)

### Custom Module

| Modul | Beschreibung |
|---|---|
| `delivery_location` | Lieferort-Verwaltung pro B2B-Kunde mit PLZ-Validierung |
| `delivery_schedule` | Terminverwaltung für Containerstell-/Abholtermine |
| `waste_code` | AVV-Abfallschlüssel-Verwaltung |
| `gewabfv` | GewAbfV-Dokumentation (Gewerbeabfallverordnung) |
| `email-notification` | SMTP-E-Mail via Brevo/SMTP-Relay |

### Seed-Scripts

```bash
# Grundkonfiguration (Region, Sales Channel, API Key, 1 Beispielprodukt)
docker exec seyfarth-medusa npx medusa exec src/scripts/seed.js

# Alle 26 Container-Produkte aus services.json
docker exec seyfarth-medusa npx medusa exec src/scripts/seed-services.js

# AVV-Abfallcodes
docker exec seyfarth-medusa npx medusa exec src/scripts/seed-waste-codes.js
```

**Nach Erstinstallation zwingend ausführen:** Zuerst `seed.js`, dann `seed-services.js`.

### CORS-Konfiguration

```
STORE_CORS=https://seyfarth.visionmakegpt.work
ADMIN_CORS=https://seyfarth.visionmakegpt.work
AUTH_CORS=https://seyfarth.visionmakegpt.work
```

---

## 7. Next.js Storefront

**Framework:** Next.js 15 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui  
**Port:** 3000 (intern)

### Seiten-Struktur

| Route | Beschreibung |
|---|---|
| `/` | Startseite mit Hero, Leistungen, Katalog, Abfallarten, CTA |
| `/embed` | iframe-fähige Katalogseite (kein Header/Footer) |
| `/embed?category=X` | Katalog vorgefiltert auf Kategorie |
| `/p/[handle]` | Produktdetailseite mit Quicklink-Button |
| `/login` | Kundenanmeldung |
| `/registrieren` | Kundenregistrierung |
| `/dashboard` | Kunden-Dashboard (Portal) |
| `/orders` | Auftragsübersicht (Portal) |
| `/orders/new` | Neue Bestellung (Portal) |
| `/locations` | Lieferorte verwalten (Portal) |
| `/checkout` | Bestellabschluss |
| `/impressum` | Impressum |
| `/datenschutz` | Datenschutzerklärung |
| `/agb` | Allgemeine Geschäftsbedingungen |

### Wichtige Komponenten

```
src/
├── app/
│   ├── page.tsx              # Startseite
│   ├── embed/page.tsx        # Embed-Katalog für iframes
│   ├── p/[handle]/page.tsx   # Produktdetail + SEO-Metadata
│   └── (portal)/             # Eingeloggter Bereich
│
├── components/
│   ├── public/
│   │   ├── header.tsx              # Dunkelblauer Header mit Cart
│   │   ├── footer.tsx              # 4-spaltiger Footer
│   │   ├── public-shell.tsx        # Wrapper Header+Footer
│   │   ├── cart-sheet.tsx          # Warenkorb-Slide-Over
│   │   ├── cookie-banner.tsx       # DSGVO Cookie-Banner
│   │   └── catalog/
│   │       ├── catalog-types.ts    # Kategorien, Filter-Logik, Preisformat
│   │       ├── product-catalog-section.tsx  # Haupt-Katalog mit Icon-Kacheln
│   │       ├── product-card.tsx    # Produktkarte mit Varianten-Buttons
│   │       └── product-landing/    # Produktdetailseite Content
│   └── portal/
│       ├── portal-shell.tsx        # Portal-Layout (Sidebar)
│       └── sidebar.tsx             # Portal-Navigation
│
└── lib/
    ├── medusa.ts          # Medusa JS-SDK Client (store-seitig)
    ├── medusa-server.ts   # Server-side Medusa-Abfragen
    ├── auth.tsx           # Auth-Context (login/logout)
    └── cart.tsx           # Warenkorb-Context
```

### Kategorie-Filter (Lucide Icons)

Die Produktkatalog-Sektion zeigt 6 visuelle Kacheln:

| Kachel | Lucide Icon | Kategorie-Key |
|---|---|---|
| Alle | LayoutGrid | null |
| BigBag & Multicar | ShoppingBag | bigbag |
| Absetzcontainer | Package | absetzcontainer |
| Abrollcontainer | Truck | abrollcontainer |
| Spezialcontainer | ShieldAlert | spezialcontainer |
| Recyclinghof | Recycle | recyclinghof |

Icons: gelb (#f8f32b) wenn aktiv, grau wenn inaktiv. Kachel wird bei Klick navy (#273582) hinterlegt.

### Build-Variablen (Compile-time)

```bash
NEXT_PUBLIC_MEDUSA_URL=https://seyfarth.visionmakegpt.work
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_MAIN_WEBSITE_URL=https://www.containerdienst-seyfarth.de
NEXT_PUBLIC_SITE_URL=https://seyfarth.visionmakegpt.work
```

**Wichtig:** Diese Werte werden beim `docker build` eingebakken — Änderung erfordert Rebuild!

---

## 8. Produktkatalog

26 Produkte in 5 Kategorien. Preise in Cent in `services.json` hinterlegt.

### BigBag & Multicar (4 Produkte)

| Produkt | Handle | Varianten | Ab-Preis |
|---|---|---|---|
| BigBag 1 m³ | bigbag-1m3 | Bauschutt, Grünschnitt, Erdaushub, Mischabfall | 69 € |
| BigBag 2 m³ | bigbag-2m3 | Bauschutt, Grünschnitt, Erdaushub, Mischabfall | 119 € |
| BigBag 3 m³ | bigbag-3m3 | Bauschutt, Grünschnitt, Erdaushub, Mischabfall | 149 € |
| Multicar-Transport | multicar-transport | bis 1t, bis 2t, bis 3t | 129 € |

### Absetzcontainer (4 Produkte)

| Produkt | Handle | Varianten | Ab-Preis |
|---|---|---|---|
| Absetzcontainer 3 m³ | absetzcontainer-3m3 | Bauschutt, Mischmüll, Holz, Grünschnitt | 199 € |
| Absetzcontainer 5 m³ | absetzcontainer-5m3 | Bauschutt, Mischmüll, Grünschnitt, Holz, Erdaushub | 229 € |
| Absetzcontainer 7 m³ | absetzcontainer-7m3 | Bauschutt, Mischmüll, Holz, Sperrmüll | 349 € |
| Absetzcontainer 10 m³ | absetzcontainer-10m3 | Bauschutt, Mischmüll, Sperrmüll, Holz, Baumischabfall | 399 € |

### Abrollcontainer (7 Produkte)

| Produkt | Handle | Ab-Preis |
|---|---|---|
| Abrollcontainer 7 m³ | abrollcontainer-7m3 | 369 € |
| Abrollcontainer 10 m³ | abrollcontainer-10m3 | 449 € |
| Abrollcontainer 15 m³ | abrollcontainer-15m3 | 549 € |
| Abrollcontainer 20 m³ | abrollcontainer-20m3 | 649 € |
| Abrollcontainer 30 m³ | abrollcontainer-30m3 | 799 € |
| Abrollcontainer 36 m³ | abrollcontainer-36m3 | 949 € |
| Abrollcontainer 40 m³ | abrollcontainer-40m3 | 1099 € |

### Spezialcontainer (6 Produkte)

| Produkt | Handle | Besonderheit |
|---|---|---|
| Dachpappe-Container 7 m³ | dachpappe-container-7m3 | teerhaltig / teerfrei |
| Asbest-Entsorgung (Big Bag) | asbest-big-bag | TRGS 519 erforderlich |
| KMF-Container (Mineralwolle) | kmf-container | TRGS 521 / 519 |
| Erdaushub-Container | erdaushub-container | 3 Größen |
| Gipskarton-Container 7 m³ | gipskarton-container-7m3 | Standard |
| Styropor-Container 20 m³ | styropor-container-20m3 | HBCD-haltig / -frei |

### Recyclinghof Anlieferung (5 Produkte)

| Produkt | Handle | Abrechnung |
|---|---|---|
| Bauschutt & Beton | recycling-bauschutt-anlieferung | per kg / Tonne |
| Altholz | recycling-altholz-anlieferung | per kg / Tonne |
| Grünschnitt | recycling-gruenschnitt-anlieferung | per kg / Tonne |
| Metall & Schrott | recycling-metall-anlieferung | Auf Anfrage |
| Sperrmüll | recycling-sperrmuell-anlieferung | per kg / Tonne |

**Hinweis:** Alle Preise sind Platzhalter aus `services.json`. Vor Produktivbetrieb durch echte Kundenpreise ersetzen und `seed-services.js` neu ausführen.

---

## 9. Design-System (Seyfarth CI)

### Farben (Tailwind Custom Colors)

```css
--color-seyfarth-navy:   #273582   /* Dunkelblau — Header, Footer, Kacheln aktiv */
--color-seyfarth-blue:   #2271b3   /* Mittelblau — Links, Sekundär */
--color-seyfarth-yellow: #f8f32b   /* Gelb — Akzente, aktive Icons */
--color-seyfarth-orange: #fbb900   /* Orange — CTA-Buttons */
```

### Typografie

- **Überschriften:** `Komika Axis` (lokal, `/public/fonts/KomikaAxis.ttf`) — Italic, alle Caps
- **Body:** Helvetica Neue / Arial / sans-serif

### Header

Sticky, `bg-seyfarth-navy`, weißes Logo (invertiert), Navigation in `text-blue-100`, hover `text-seyfarth-yellow`. CTA-Button orange.

### Footer

4-spaltig: Branding / Kontakt / Rechtliches / Zertifizierung. `bg-seyfarth-navy`, Kontakt-Icons in `text-seyfarth-yellow`.

### Produktkacheln (Filter)

Grid 2→3→6 Spalten (responsive). Aktiv: navy Hintergrund, gelbes Icon. Inaktiv: weißer Hintergrund, Border, grauer Icon.

---

## 10. Deployment-Workflow

### Erster Deploy (Erstinstallation)

```bash
# 1. Code auf Server syncen
cd /Users/sebastianhendrich/ContainerShop
rsync -az --exclude='.git' --exclude='node_modules' --exclude='.next' \
  --exclude='*.log' --exclude='.env*' --exclude='*.png' \
  . hetzner-prod:/opt/seyfarth/

# 2. Tunnel-Credentials auf Server platzieren
scp /tmp/tunnel-credentials.json hetzner-prod:/opt/seyfarth/tunnel-credentials.json
chmod 644 auf dem Server setzen

# 3. .env deployen
scp .env.prod hetzner-prod:/opt/seyfarth/.env

# 4. Backend-Image bauen (oder von claw transferieren)
ssh hetzner-prod "docker build -t seyfarth-medusa:latest /opt/seyfarth/backend"

# 5. Storefront-Image bauen
ssh hetzner-prod "docker build \
  --build-arg NEXT_PUBLIC_MEDUSA_URL=https://seyfarth.visionmakegpt.work \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_REPLACE_AFTER_SEED \
  --build-arg NEXT_PUBLIC_MAIN_WEBSITE_URL=https://www.containerdienst-seyfarth.de \
  --build-arg NEXT_PUBLIC_SITE_URL=https://seyfarth.visionmakegpt.work \
  -t seyfarth-storefront:latest /opt/seyfarth/storefront"

# 6. Stack starten (ohne Tunnel zunächst)
ssh hetzner-prod "cd /opt/seyfarth && \
  docker compose -f docker-compose.seyfarth.yml --env-file .env up -d"

# 7. Seed ausführen
ssh hetzner-prod "docker exec seyfarth-medusa npx medusa exec src/scripts/seed.js"
ssh hetzner-prod "docker exec seyfarth-medusa \
  cp /opt/seyfarth/backend/src/data/services.json \
     /app/.medusa/server/src/data/services.json"  # services.json rein
ssh hetzner-prod "docker exec seyfarth-medusa npx medusa exec src/scripts/seed-services.js"

# 8. Publishable Key auslesen
ssh hetzner-prod "docker exec seyfarth-postgres psql -U seyfarth seyfarth-store \
  -tAc \"SELECT token FROM api_key WHERE type='publishable';\""

# 9. Storefront mit echtem pk_ neu bauen (Key aus Schritt 8 einsetzen)
# Dann docker compose up -d --force-recreate seyfarth-storefront

# 10. Tunnel-Container starten
ssh hetzner-prod "cd /opt/seyfarth && \
  docker compose -f docker-compose.seyfarth.yml --env-file .env --profile prod up -d seyfarth-tunnel"
```

### Update (laufendes System)

```bash
# Nur Storefront (z.B. nach Code-Änderungen)
cd /Users/sebastianhendrich/ContainerShop
rsync -az storefront/ hetzner-prod:/opt/seyfarth/storefront/

ssh hetzner-prod "docker build \
  --build-arg NEXT_PUBLIC_MEDUSA_URL=https://seyfarth.visionmakegpt.work \
  --build-arg NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_dbb64ec2100a4e6bc878cedf6228fc0f4958646df961e72d5bae5349607dfbb2 \
  --build-arg NEXT_PUBLIC_MAIN_WEBSITE_URL=https://www.containerdienst-seyfarth.de \
  --build-arg NEXT_PUBLIC_SITE_URL=https://seyfarth.visionmakegpt.work \
  --cache-from seyfarth-storefront:latest \
  -t seyfarth-storefront:latest /opt/seyfarth/storefront && \
  cd /opt/seyfarth && \
  docker compose -f docker-compose.seyfarth.yml --env-file .env --profile prod \
  up -d --force-recreate seyfarth-storefront seyfarth-nginx"
```

### Produkte aktualisieren

```bash
# services.json lokal bearbeiten, dann:
scp backend/src/data/services.json hetzner-prod:/opt/seyfarth/backend/src/data/
ssh hetzner-prod "docker cp /opt/seyfarth/backend/src/data/services.json \
  seyfarth-medusa:/app/.medusa/server/src/data/services.json"
ssh hetzner-prod "docker exec seyfarth-medusa npx medusa exec src/scripts/seed-services.js"
```

### Image-Transfer (wenn hetzner-claw für DEV)

Wenn npm install auf prod baut und dev von claw kommen soll:
```bash
# Von prod nach claw transferieren
ssh hetzner-prod "docker save seyfarth-storefront:latest | gzip" | \
  ssh hetzner-claw "docker load && docker tag seyfarth-storefront:latest seyfarth-storefront:dev"
```

### Logs & Debugging

```bash
# Medusa-Logs
docker logs seyfarth-medusa --tail 50 -f

# Nginx-Access-Log
docker logs seyfarth-nginx --tail 20

# Tunnel-Status
docker logs seyfarth-tunnel --tail 10

# API manuell testen
docker exec seyfarth-medusa node -e "
const http = require('http');
http.get({hostname:'localhost',port:9000,path:'/store/products?limit=3',
  headers:{'x-publishable-api-key':'pk_dbb64...'}},
  res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>console.log(res.statusCode, d.slice(0,200))); });
"
```

---

## 11. onepage.me Integration

Dokumentation zur Einbindung in https://containerdienst-seyfarth.onepage.me

In onepage.me: Abschnitt bearbeiten → "Custom Code" → HTML-Code einfügen.  
Referenz: https://help.onepage.io/de/articles/3608652-custom-code-in-abschnitten-einfugen

### Snippet A — Voller Katalog (iframe)

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed"
    width="100%" height="1800" frameborder="0"
    scrolling="auto" allow="payment"
    title="Seyfarth Container-Portal"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet B — Absetzcontainer gefiltert

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer"
    width="100%" height="1200" frameborder="0"
    scrolling="auto" allow="payment"
    title="Absetzcontainer bestellen"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet C — Abrollcontainer gefiltert

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer"
    width="100%" height="1400" frameborder="0"
    scrolling="auto" allow="payment"
    title="Abrollcontainer bestellen"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet D — BigBag & Multicar

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=bigbag"
    width="100%" height="1000" frameborder="0"
    scrolling="auto" allow="payment"
    title="BigBag bestellen"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet E — Spezialcontainer (Gefahrstoffe)

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer"
    width="100%" height="1200" frameborder="0"
    scrolling="auto" allow="payment"
    title="Spezialcontainer & Gefahrstoffe"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet F — Recyclinghof Anlieferung

```html
<div style="width:100%;border-radius:16px;overflow:hidden;
            box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=recyclinghof"
    width="100%" height="1000" frameborder="0"
    scrolling="auto" allow="payment"
    title="Recyclinghof Anlieferung"
    style="display:block;border:none;"
    loading="lazy">
  </iframe>
</div>
```

### Snippet G — Kategorie-Buttons (kein iframe, öffnet neuen Tab)

```html
<style>
.sey-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
  gap:12px;max-width:900px;margin:0 auto;padding:0 16px;font-family:system-ui,sans-serif;}
.sey-btn{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 16px;
  border-radius:16px;background:white;border:2px solid #e5e7eb;text-decoration:none;
  color:#273582;font-weight:600;font-size:14px;text-align:center;transition:all .2s;
  box-shadow:0 2px 8px rgba(0,0,0,.06);}
.sey-btn:hover{border-color:#273582;background:#273582;color:white;
  transform:translateY(-2px);box-shadow:0 8px 20px rgba(39,53,130,.2);}
.sey-btn svg{width:28px;height:28px;stroke-width:1.5;}
.sey-sub{font-size:11px;font-weight:400;opacity:.6;}
.sey-cta{text-align:center;margin-top:20px;font-family:system-ui,sans-serif;}
.sey-cta a{display:inline-block;padding:14px 32px;background:#fbb900;color:#273582;
  font-weight:700;font-size:15px;border-radius:9999px;text-decoration:none;
  box-shadow:0 4px 16px rgba(251,185,0,.3);transition:all .2s;}
.sey-cta a:hover{background:#f8f32b;transform:translateY(-1px);}
</style>
<div class="sey-grid">
  <a href="https://seyfarth.visionmakegpt.work/embed?category=bigbag" target="_blank" class="sey-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    <span>BigBag &amp; Multicar</span>
    <span class="sey-sub">1 – 3 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer" target="_blank" class="sey-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    <span>Absetzcontainer</span>
    <span class="sey-sub">3 – 10 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer" target="_blank" class="sey-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    <span>Abrollcontainer</span>
    <span class="sey-sub">7 – 40 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer" target="_blank" class="sey-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    <span>Spezialcontainer</span>
    <span class="sey-sub">Gefahrstoffe</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=recyclinghof" target="_blank" class="sey-btn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
    <span>Recyclinghof</span>
    <span class="sey-sub">Direktanlieferung</span>
  </a>
</div>
<div class="sey-cta">
  <a href="https://seyfarth.visionmakegpt.work" target="_blank">🛒 Zum Bestellshop</a>
</div>
```

### Snippet H — Einzelner Produkt-Direktlink (Button)

```html
<style>
.sey-plink{display:inline-flex;align-items:center;gap:10px;padding:14px 28px;
  background:#273582;color:white;font-family:system-ui,sans-serif;font-weight:600;
  font-size:15px;border-radius:12px;text-decoration:none;
  box-shadow:0 4px 16px rgba(39,53,130,.25);transition:all .2s;}
.sey-plink:hover{background:#fbb900;color:#273582;transform:translateY(-2px);}
</style>

<!-- Beispiel: Absetzcontainer 7m³ — Link anpassen -->
<a href="https://seyfarth.visionmakegpt.work/p/absetzcontainer-7m3"
   target="_blank" class="sey-plink">
  Container 7 m³ direkt bestellen →
</a>
```

---

## 12. Alle URLs & Quicklinks

### Live-Systeme

| | URL |
|---|---|
| **Prod Shop** | https://seyfarth.visionmakegpt.work |
| **Dev Shop** | https://seyfarth-dev.visionmakegpt.work |
| **Prod Embed alle** | https://seyfarth.visionmakegpt.work/embed |
| **Prod Embed BigBag** | https://seyfarth.visionmakegpt.work/embed?category=bigbag |
| **Prod Embed Absetz** | https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer |
| **Prod Embed Abroll** | https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer |
| **Prod Embed Spezial** | https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer |
| **Prod Embed Recycling** | https://seyfarth.visionmakegpt.work/embed?category=recyclinghof |
| **Admin Panel (Prod)** | https://seyfarth.visionmakegpt.work/admin |

### Produkt-Quicklinks (Prod)

**BigBag & Multicar**
```
https://seyfarth.visionmakegpt.work/p/bigbag-1m3
https://seyfarth.visionmakegpt.work/p/bigbag-2m3
https://seyfarth.visionmakegpt.work/p/bigbag-3m3
https://seyfarth.visionmakegpt.work/p/multicar-transport
```

**Absetzcontainer**
```
https://seyfarth.visionmakegpt.work/p/absetzcontainer-3m3
https://seyfarth.visionmakegpt.work/p/absetzcontainer-5m3
https://seyfarth.visionmakegpt.work/p/absetzcontainer-7m3
https://seyfarth.visionmakegpt.work/p/absetzcontainer-10m3
```

**Abrollcontainer**
```
https://seyfarth.visionmakegpt.work/p/abrollcontainer-7m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-10m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-15m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-20m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-30m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-36m3
https://seyfarth.visionmakegpt.work/p/abrollcontainer-40m3
```

**Spezialcontainer**
```
https://seyfarth.visionmakegpt.work/p/dachpappe-container-7m3
https://seyfarth.visionmakegpt.work/p/asbest-big-bag
https://seyfarth.visionmakegpt.work/p/kmf-container
https://seyfarth.visionmakegpt.work/p/erdaushub-container
https://seyfarth.visionmakegpt.work/p/gipskarton-container-7m3
https://seyfarth.visionmakegpt.work/p/styropor-container-20m3
```

**Recyclinghof**
```
https://seyfarth.visionmakegpt.work/p/recycling-bauschutt-anlieferung
https://seyfarth.visionmakegpt.work/p/recycling-altholz-anlieferung
https://seyfarth.visionmakegpt.work/p/recycling-gruenschnitt-anlieferung
https://seyfarth.visionmakegpt.work/p/recycling-metall-anlieferung
https://seyfarth.visionmakegpt.work/p/recycling-sperrmuell-anlieferung
```

---

## 13. Konfigurationsdateien

| Datei | Beschreibung |
|---|---|
| `docker-compose.seyfarth.yml` | Haupt-Compose-Stack (beide Umgebungen) |
| `nginx.seyfarth.conf` | Nginx-Routing (Store-API, Auth, Admin, Storefront) |
| `tunnel-config.yml` | Cloudflare Tunnel Ingress (Prod) |
| `tunnel-config.dev.yml` | Cloudflare Tunnel Ingress (Dev) |
| `.env.dev` | Umgebungsvariablen DEV |
| `.env.prod` | Umgebungsvariablen PROD (mit echten Secrets) |
| `.env.prod.template` | Template für neue Prod-Instanz |
| `.env.example` | Dokumentation aller Variablen |
| `backend/medusa-config.ts` | Medusa-Konfiguration (CORS, Module, SMTP) |
| `backend/src/data/services.json` | Produktkatalog (Preise in Cent, editierbar) |
| `backend/Dockerfile` | Medusa Backend Image |
| `storefront/Dockerfile` | Next.js Storefront Image |
| `deploy.sh` | Deploy-Skript (dev/prod/seed-dev/seed-prod) |

### Wichtige Umgebungsvariablen

```bash
# Prod
NODE_ENV=production
POSTGRES_PASSWORD=<stark, mind. 32 Zeichen>
JWT_SECRET=<openssl rand -hex 32>
COOKIE_SECRET=<openssl rand -hex 32>
MEDUSA_BACKEND_URL=https://seyfarth.visionmakegpt.work
MEDUSA_PUBLISHABLE_KEY=pk_dbb64ec2100a4e6bc878cedf6228fc0f4958646df961e72d5bae5349607dfbb2
STORE_CORS=https://seyfarth.visionmakegpt.work
ADMIN_CORS=https://seyfarth.visionmakegpt.work
AUTH_CORS=https://seyfarth.visionmakegpt.work
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<Brevo-Login>
SMTP_PASS=<Brevo-API-Key>
SMTP_FROM=noreply@seyfarth-container.de
OPERATOR_EMAIL=info@seyfarth-container.de
```

---

## 14. Bekannte Einschränkungen & TODOs

### Sofort zu erledigen vor Produktivbetrieb

- [ ] **Echte Preise** in `backend/src/data/services.json` eintragen und Seed neu ausführen
- [ ] **SMTP konfigurieren** — Brevo-Zugangsdaten in `.env.prod` eintragen
- [ ] **Admin-Account anlegen** — https://seyfarth.visionmakegpt.work/admin → Ersteinrichtung
- [ ] **Impressum/Datenschutz** — Echte Inhalte in `storefront/src/app/impressum/page.tsx` und `datenschutz/page.tsx`
- [ ] **AGB** — Echte Inhalte in `storefront/src/app/agb/page.tsx`
- [ ] **Logo** — `/storefront/public/logo-seyfarth.png` durch echtes Logo ersetzen (400×133px empfohlen)

### Geplante Erweiterungen

- [ ] **Checkout-Flow** — Lieferadresse, Wunschtermin, Bestellbestätigung per E-Mail
- [ ] **Kunden-Portal** — Auftragshistorie, Dokumente (Lieferscheine, Wiegescheine)
- [ ] **Lieferort-Verwaltung** — PLZ-Validierung gegen Einzugsgebiet
- [ ] **ERP-Sync** — SFTP + XML/CSV Export für Auftragsdaten
- [ ] **Preislogik** — Kundenindividuelle Preise je nach B2B-Tier
- [ ] **GewAbfV-Dokumentation** — Trennungsbegründungen und Nachweisdokumente

### Technische Schulden

- Dev-Storefront auf hetzner-claw muss nach Server-Überlastung neu deployed werden (Image liegt auf hetzner-prod als `seyfarth-storefront:dev` bereit)
- Build auf hetzner-claw/prod dauert lange wegen npm install — Image-Transfer von einem Server zum anderen ist schneller als Rebuild
- `category-sidebar.tsx` und `waste-type-filter-bar.tsx` sind nicht mehr im Einsatz, können entfernt werden
- Tunnel-Credentials-Datei muss manuell auf Server platziert werden (nicht in Repo)

### Sicherheitshinweise

- `.env.prod` niemals committen
- `tunnel-credentials.json` niemals committen
- `JWT_SECRET` und `COOKIE_SECRET` müssen > 32 Zeichen starke Zufallswerte sein
- Medusa Admin-Panel nur über Cloudflare-Tunnel erreichbar (kein direkter Port-Zugang)
- PostgreSQL und Redis sind nicht nach außen exposed (kein Host-Port-Binding in Prod)
