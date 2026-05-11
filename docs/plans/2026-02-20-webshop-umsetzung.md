# Webshop Container Seyfarth — Umsetzungsplan (7.000 EUR Scope)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Den bestehenden Prototyp zum produktionsreifen B2B-Onlineshop für Seyfarth Container-Dienst ausbauen — mit Design nach Contentwerke-Vorgaben, funktionierendem E-Mail-Versand, Instagram-optimierten Produktlinks, DSGVO-konformen Seiten und Hetzner-Deployment.

**Architecture:** Medusa.js v2 Backend (PostgreSQL 16, Redis 7) mit Next.js 15 Storefront. Docker Compose für Entwicklung und Produktion. Nginx als Reverse Proxy auf Hetzner. E-Mail über Nodemailer + SMTP (Brevo oder Kunden-SMTP).

**Tech Stack:** Medusa.js v2, Next.js 15, Tailwind CSS 4, shadcn/ui, Nodemailer, React Email, Docker Compose, Nginx, Hetzner Cloud

---

## Bestandsaufnahme — Was ist bereits da

### Backend (Medusa.js v2)
- Custom Modules: `delivery_location`, `waste_code`, `gewabfv`, `delivery_schedule`
- API-Routes: CRUD für Lieferorte, Abfallschlüssel, GewAbfV-Erklärungen, Terminplanung
- Seed-Scripts: 4 Behältertypen × Abfallarten, 15 AVV-Nummern
- Subscriber: `order-placed` (nutzt aktuell `notification-local` — nur Log, kein echter E-Mail-Versand)
- Medusa Admin Dashboard: out-of-the-box

### Frontend (Next.js 15)
- Homepage mit Hero, Leistungen, Katalog, Abfallarten, "So funktioniert's", CTA
- Produktseiten (`/p/[handle]`) mit Open Graph Meta-Tags (Instagram-tauglich)
- Checkout mit 6 Schritten: Warenkorb → Konto → Lieferort → Compliance → Details → Bestätigen
- Conditional Checkout: GewAbfV-Erklärung, Erzeugernummer, eANV-Vollmacht
- Kundenportal: Dashboard, Lieferort-Verwaltung, Auftragshistorie
- Login + Registrierung
- Seyfarth CI: Farben (navy, blue, orange, yellow), Komika Axis Font

### Infrastruktur
- `docker-compose.yml` (dev) + `docker-compose.prod.yml` (prod mit Nginx)
- Deployment-Script: `infrastructure/deploy-to-server.sh`
- Monitoring-Template: `infrastructure/monitoring/`

---

## Task 1: SMTP E-Mail-Provider einrichten (Backend)

**Files:**
- Modify: `backend/medusa-config.ts`
- Modify: `backend/package.json` (Dependency)
- Modify: `backend/src/subscribers/order-placed.ts`

**Step 1: Medusa Notification Provider für SendGrid/Resend installieren**

Medusa v2 hat einen offiziellen `@medusajs/notification-sendgrid` Provider, alternativ Resend oder einen Custom SMTP-Provider. Da Brevo (Sendinblue) als SMTP eingesetzt werden soll, setzen wir einen eigenen Notification Provider auf.

```bash
cd /Users/sebastianhendrich/ContainerShop/backend
npm install nodemailer
npm install -D @types/nodemailer
```

**Step 2: Custom Notification Provider erstellen**

Create: `backend/src/modules/email-notification/index.ts`
Create: `backend/src/modules/email-notification/service.ts`

Der Service implementiert das Medusa `INotificationProvider` Interface und nutzt Nodemailer mit SMTP-Konfiguration (Host, Port, User, Pass aus Environment-Variablen).

```typescript
// backend/src/modules/email-notification/service.ts
import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import nodemailer from "nodemailer"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/framework/types"

type Options = {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_pass: string
  from_email: string
  from_name: string
}

class EmailNotificationService extends AbstractNotificationProviderService {
  static identifier = "email-notification"
  private transporter: nodemailer.Transporter
  private from: string

  constructor(container: Record<string, unknown>, options: Options) {
    super()
    this.transporter = nodemailer.createTransport({
      host: options.smtp_host,
      port: options.smtp_port,
      secure: options.smtp_port === 465,
      auth: { user: options.smtp_user, pass: options.smtp_pass },
    })
    this.from = `"${options.from_name}" <${options.from_email}>`
  }

  async send(notification: ProviderSendNotificationDTO): Promise<ProviderSendNotificationResultsDTO> {
    const { to, template, data } = notification
    const subject = this.getSubject(template, data)
    const html = this.getHtml(template, data)

    await this.transporter.sendMail({ from: this.from, to, subject, html })
    return { id: `email-${Date.now()}` }
  }

  private getSubject(template: string, data: Record<string, unknown>): string {
    switch (template) {
      case "order-placed":
        return `Neue Bestellung #${data.display_id} — Seyfarth Container-Dienst`
      default:
        return "Seyfarth Container-Dienst"
    }
  }

  private getHtml(template: string, data: Record<string, unknown>): string {
    // Einfaches HTML-Template — später durch React Email ersetzen
    switch (template) {
      case "order-placed":
        return `<h1>Vielen Dank für Ihren Auftrag!</h1>
          <p>Auftragsnummer: #${data.display_id}</p>
          <p>Wir melden uns zeitnah zur Terminabstimmung.</p>
          <p>Mit freundlichen Grüßen<br/>Seyfarth Container-Dienst</p>`
      default:
        return `<p>${JSON.stringify(data)}</p>`
    }
  }
}

export default EmailNotificationService
```

```typescript
// backend/src/modules/email-notification/index.ts
import EmailNotificationService from "./service"
import { Module } from "@medusajs/framework/utils"

export default Module("email-notification", {
  service: EmailNotificationService,
})
```

**Step 3: medusa-config.ts aktualisieren**

Ersetze den `notification-local` Provider durch den neuen:

```typescript
// In medusa-config.ts, modules Array:
{
  resolve: "@medusajs/medusa/notification",
  options: {
    providers: [
      {
        resolve: "./src/modules/email-notification",
        id: "email-notification",
        options: {
          channels: ["email"],
          smtp_host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
          smtp_port: parseInt(process.env.SMTP_PORT || "587"),
          smtp_user: process.env.SMTP_USER || "",
          smtp_pass: process.env.SMTP_PASS || "",
          from_email: process.env.SMTP_FROM || "noreply@seyfarth-container.de",
          from_name: process.env.SMTP_FROM_NAME || "Seyfarth Container-Dienst",
        },
      },
    ],
  },
},
```

**Step 4: Subscriber erweitern — auch Betreiber benachrichtigen**

```typescript
// backend/src/subscribers/order-placed.ts — zweite Notification an Betreiber hinzufügen
const OPERATOR_EMAIL = process.env.OPERATOR_EMAIL || "info@seyfarth-container.de"

// Nach der Kunden-Mail:
await notificationService.createNotifications({
  to: OPERATOR_EMAIL,
  channel: "email",
  template: "order-placed-internal",
  data: {
    order_id: order.id,
    display_id: order.display_id,
    email: order.email,
    items: order.items,
    total: order.total,
    metadata: order.metadata,
  },
})
```

**Step 5: Environment-Variablen in docker-compose ergänzen**

In `docker-compose.yml` und `docker-compose.prod.yml` beim `medusa` Service:
```yaml
SMTP_HOST: ${SMTP_HOST:-smtp-relay.brevo.com}
SMTP_PORT: ${SMTP_PORT:-587}
SMTP_USER: ${SMTP_USER:-}
SMTP_PASS: ${SMTP_PASS:-}
SMTP_FROM: ${SMTP_FROM:-noreply@seyfarth-container.de}
SMTP_FROM_NAME: ${SMTP_FROM_NAME:-Seyfarth Container-Dienst}
OPERATOR_EMAIL: ${OPERATOR_EMAIL:-info@seyfarth-container.de}
```

**Step 6: Commit**

```bash
git add backend/src/modules/email-notification/ backend/src/subscribers/order-placed.ts backend/medusa-config.ts backend/package.json backend/package-lock.json docker-compose.yml docker-compose.prod.yml
git commit -m "feat: add SMTP email notification provider with Nodemailer"
```

---

## Task 2: Checkout finalisieren und Order-Erstellung absichern

**Files:**
- Modify: `storefront/src/app/checkout/page.tsx`

Der Checkout erstellt zwar einen Medusa Cart und fügt Line Items hinzu, aber der Cart wird nie completed (kein Payment, keine Shipping-Methode). Für einen "Auftrag statt Bestellung"-Flow müssen wir:

**Step 1: Cart-Completion ohne Payment-Gateway**

Medusa v2 erfordert für `cart.complete()` eine Payment Session und Shipping Method. Für den Auftrags-Flow (keine direkte Bezahlung) nutzen wir die "Manual Payment" Methode, die Medusa v2 out-of-the-box bietet. Der Admin muss einmalig eine Region mit manueller Zahlung und Versandoption einrichten.

Alternative: Wir bleiben beim aktuellen Ansatz (Cart + Metadata), da Seyfarth die Preise ohnehin individuell kalkuliert und keine Online-Zahlung gewünscht ist. Der Cart dient als "Anfrage", nicht als Kauf. In dem Fall dokumentieren wir das klar.

**Entscheidung:** Da es um "Aufträge, nicht Bestellungen" geht, ist der aktuelle Ansatz (Cart als Anfrage-Container) sinnvoll. Wir polieren den Checkout:

- Erfolgs-Page nach Bestellung (statt Redirect mit Query-Param)
- Fehlerbehandlung verbessern (nicht silently catchen)
- Loading-States für bessere UX

**Step 2: Erfolgsseite erstellen**

Create: `storefront/src/app/checkout/success/page.tsx`

```tsx
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <PublicShell>
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="text-3xl font-bold text-seyfarth-navy mb-4">
          Vielen Dank für Ihren Auftrag!
        </h1>
        <p className="text-zinc-600 mb-2">
          Wir haben Ihre Anfrage erhalten und melden uns zeitnah zur Terminabstimmung.
        </p>
        <p className="text-zinc-500 text-sm mb-8">
          Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild className="bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full">
            <Link href="/">Zurück zum Shop</Link>
          </Button>
        </div>
      </div>
    </PublicShell>
  )
}
```

**Step 3: Checkout-Redirect auf Erfolgsseite ändern**

In `checkout/page.tsx` die Redirects in `handleConfirm` ändern:
```typescript
// Statt: router.push(isAuthenticated ? "/orders" : "/?bestellt=1")
router.push("/checkout/success")
```

**Step 4: Error-Handling im Checkout verbessern**

Im `catch` Block von `handleConfirm` eine User-sichtbare Fehlermeldung zeigen statt silent fail.

**Step 5: Commit**

```bash
git add storefront/src/app/checkout/
git commit -m "feat: add checkout success page and improve error handling"
```

---

## Task 3: DSGVO-Seiten erstellen (Impressum, Datenschutz, AGB)

**Files:**
- Create: `storefront/src/app/impressum/page.tsx`
- Create: `storefront/src/app/datenschutz/page.tsx`
- Create: `storefront/src/app/agb/page.tsx`
- Modify: `storefront/src/components/public/footer.tsx`

**Step 1: Impressum-Seite erstellen**

Statische Seite mit den Pflichtangaben nach § 5 TMG. Platzhalter für Seyfarth-Daten (Firma, Adresse, Geschäftsführer, USt-IdNr, Handelsregister, Telefon, E-Mail). Der Text wird mit Seyfarth abgestimmt.

```tsx
// storefront/src/app/impressum/page.tsx
import { PublicShell } from "@/components/public/public-shell"

export const metadata = { title: "Impressum | Seyfarth Container-Dienst" }

export default function ImpressumPage() {
  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-seyfarth-navy mb-8">Impressum</h1>
        <div className="prose prose-zinc max-w-none">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            <strong>Seyfarth Container-Dienst</strong><br/>
            [Straße + Nr.]<br/>
            [PLZ] Ponitz<br/>
          </p>
          {/* ... Kontakt, Vertretungsberechtigter, Registereintrag, USt-IdNr ... */}
          <h2>Kontakt</h2>
          <p>Telefon: [Telefonnummer]<br/>E-Mail: [E-Mail]</p>
          <h2>Streitschlichtung</h2>
          <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          https://ec.europa.eu/consumers/odr/</p>
        </div>
      </div>
    </PublicShell>
  )
}
```

**Step 2: Datenschutz-Seite erstellen**

Datenschutzerklärung nach DSGVO Art. 13/14. Abschnitte: Verantwortlicher, Hosting (Hetzner DE), Cookies (nur technisch notwendige), Server-Log-Files, Kontaktformular, Kundenkonto, Bestellabwicklung, Rechte der Betroffenen (Auskunft, Löschung, Widerspruch, Datenportabilität).

Create: `storefront/src/app/datenschutz/page.tsx`

**Step 3: AGB-Seite erstellen**

Allgemeine Geschäftsbedingungen als Platzhalter — wird mit Seyfarth/Anwalt abgestimmt.

Create: `storefront/src/app/agb/page.tsx`

**Step 4: Footer-Links aktualisieren**

In `storefront/src/components/public/footer.tsx` die Links zu Impressum, Datenschutz, AGB hinzufügen.

**Step 5: Cookie-Consent implementieren**

Einfachen Cookie-Banner erstellen (kein Klaro.js nötig, da nur technisch notwendige Cookies verwendet werden). Ein dezenter Banner am unteren Rand mit "Verstanden"-Button reicht, da keine Tracking-Cookies eingesetzt werden.

Create: `storefront/src/components/public/cookie-banner.tsx`

Einbinden in `storefront/src/app/layout.tsx`.

**Step 6: Commit**

```bash
git add storefront/src/app/impressum/ storefront/src/app/datenschutz/ storefront/src/app/agb/ storefront/src/components/public/cookie-banner.tsx storefront/src/components/public/footer.tsx storefront/src/app/layout.tsx
git commit -m "feat: add DSGVO pages (Impressum, Datenschutz, AGB) and cookie banner"
```

---

## Task 4: Artikelimport finalisieren — echte Daten einpflegen

**Files:**
- Modify: `backend/src/scripts/seed-services.ts`
- Modify: `backend/src/scripts/seed-waste-codes.ts`

**Step 1: Seed-Script mit Platzhalter-Preisen aktualisieren**

Die Seed-Daten enthalten aktuell Beispielpreise. Seyfarth muss echte Preise liefern (oder "auf Anfrage"). Bis dahin: Seed-Script so aufbauen, dass die Daten aus einer einfachen JSON/CSV-Datei gelesen werden können.

Create: `backend/src/data/services.json` — JSON mit allen Behältertypen, Varianten, Preisen.

**Step 2: AVV-Nummern vervollständigen**

Aktuell 15 AVV-Nummern im Seed. Prüfen ob alle von Seyfarth angebotenen Abfallarten abgedeckt sind. Die AVV-Nummern sind standardisiert — die Liste ist korrekt, kann aber erweitert werden.

**Step 3: Admin-Dashboard konfigurieren**

Dokumentation für Seyfarth erstellen:
- Region "Deutschland" mit Versandoption
- Steuern (19% MwSt)
- Admin-User anlegen

Dies ist ein manueller Schritt nach Deployment, aber wir dokumentieren ihn hier.

**Step 4: Commit**

```bash
git add backend/src/scripts/ backend/src/data/
git commit -m "feat: finalize service catalog seed data with configurable prices"
```

---

## Task 5: Frontenddesign nach Contentwerke-Vorgaben

**Files:**
- Modify: `storefront/src/app/globals.css`
- Modify: `storefront/src/app/page.tsx`
- Modify: `storefront/src/components/public/header.tsx`
- Modify: `storefront/src/components/public/footer.tsx`
- Modify: `storefront/src/components/public/public-shell.tsx`

**Step 1: Design-Vorgaben von Contentwerke einholen**

**ACHTUNG: Blockt diesen Task!** Die Design-Vorgaben von Contentwerke GmbH müssen vorliegen. Bis dahin arbeiten wir mit dem aktuellen Seyfarth-CI weiter (das bereits implementiert ist: Navy, Blue, Orange, Yellow, Komika Axis).

**Step 2: CSS-Variablen und Schriften anpassen**

Sobald die Vorgaben da sind:
- Farbpalette in `globals.css` anpassen (Seyfarth CI Colors sind bereits definiert)
- Zusätzliche Schriften einbinden falls von Contentwerke vorgegeben
- Breakpoints und Spacing-System abgleichen

**Step 3: Komponenten nach Vorgaben stylen**

- Header: Logo-Position, Navigation, responsive Menü
- Footer: Layout, Kontaktinformationen, Social Links
- Hero-Section: Background, Textanordnung, CTA-Button-Stil
- Produktkarten: Layout nach Vorgabe
- Checkout: visuelles Polish

**Step 4: Mobile Responsive prüfen**

Alle Seiten auf Mobile (375px), Tablet (768px), Desktop (1280px+) testen.

**Step 5: Commit**

```bash
git add storefront/src/
git commit -m "feat: apply Contentwerke design specifications"
```

---

## Task 6: Instagram-optimierte Produktlinks

**Files:**
- Modify: `storefront/src/app/p/[handle]/page.tsx`
- Modify: `storefront/src/components/public/product-landing/product-landing-content.tsx`

**Step 1: Prüfung — bereits implementiert?**

Die Produktseite `/p/[handle]` hat bereits:
- Open Graph Meta-Tags (title, description, image, url)
- Twitter Card Meta-Tags
- `generateMetadata()` mit Produkt-spezifischen Daten

**Das ist bereits Instagram-tauglich!** Instagram nutzt Open Graph Tags für Link-Vorschauen.

**Step 2: Verbesserungen**

- Produkt-Thumbnails/Bilder: Seyfarth muss Produktfotos liefern (Container-Fotos). Aktuell Fallback auf Logo.
- Kurze, share-freundliche URLs: `/p/absetzcontainer-3m3-bauschutt` — bereits durch Medusa `handle` gegeben.
- "Jetzt bestellen"-CTA direkt auf der Produktseite, der ins Cart + Checkout leitet.

**Step 3: Social-Share-Preview testen**

Manuell prüfen: URL in Instagrams Link-Preview, Facebook Debugger, Twitter Card Validator eingeben.

**Step 4: Commit**

```bash
git add storefront/src/app/p/
git commit -m "feat: improve Instagram/social sharing meta tags on product pages"
```

---

## Task 7: Integration in bestehende Seyfarth-Website

**Step 1: Abklärung mit Contentwerke**

Wie soll der Shop in die bestehende Website integriert werden?
- **Option A: Subdomain** — `shop.seyfarth-container.de` (empfohlen, einfachste Lösung)
- **Option B: Unterverzeichnis** — `seyfarth-container.de/shop/` (erfordert Reverse Proxy auf der Hauptseite)
- **Option C: iFrame/Link** — Einfacher Link von der Hauptseite zum Shop

**Step 2: DNS/Domain konfigurieren**

Je nach Option:
- Subdomain: A-Record oder CNAME auf Hetzner-IP
- Next.js `basePath` setzen falls Unterverzeichnis

**Step 3: Header/Navigation anpassen**

Link zurück zur Hauptseite in der Shop-Navigation. Konsistentes Branding mit der bestehenden Website.

**Step 4: Commit**

```bash
git add storefront/next.config.ts storefront/src/components/public/header.tsx
git commit -m "feat: configure website integration (subdomain/basePath)"
```

---

## Task 8: Hetzner Server Deployment

**Files:**
- Modify: `docker-compose.prod.yml`
- Modify: `nginx.conf`
- Modify: `infrastructure/deploy-to-server.sh`

**Step 1: Hetzner Cloud Server bestellen**

- CPX21 oder CPX31 (2-4 vCPU, 4-8GB RAM)
- Ubuntu 24.04 LTS
- Standort: Falkenstein oder Nürnberg (DE)
- Firewall: 22 (SSH), 80 (HTTP), 443 (HTTPS)

**Step 2: Server einrichten**

```bash
# Auf dem Server:
apt update && apt upgrade -y
apt install docker.io docker-compose-plugin git -y
systemctl enable docker
```

**Step 3: SSL/TLS mit Traefik oder Cloudflare Tunnel**

Zwei Optionen:
- **Traefik 3** als Reverse Proxy mit Let's Encrypt (empfohlen für einfaches Setup)
- **Cloudflare Tunnel** (bereits in Infrastruktur-Doku beschrieben)

Für den einfachen Ansatz nutzen wir Nginx + Certbot:

```nginx
# nginx.conf — Prod-Konfiguration mit SSL
server {
    listen 80;
    server_name shop.seyfarth-container.de;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name shop.seyfarth-container.de;

    ssl_certificate /etc/letsencrypt/live/shop.seyfarth-container.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shop.seyfarth-container.de/privkey.pem;

    location /api/ {
        proxy_pass http://medusa:9000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin {
        proxy_pass http://medusa:9000/app;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://storefront:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Step 4: docker-compose.prod.yml anpassen**

- CORS-URLs auf die echte Domain setzen
- Secrets aus `.env.prod` laden
- Nginx-Service um SSL-Volumes erweitern
- Port 443 exponieren

**Step 5: Deploy-Script nutzen**

`infrastructure/deploy-to-server.sh` enthält bereits ein Deployment-Script. Dieses anpassen auf die finale Domain und Server-IP.

**Step 6: Backup einrichten**

Einfaches tägliches Backup:
```bash
# /etc/cron.daily/backup-containershop
pg_dump -U medusa medusa-store | gzip > /backups/medusa-$(date +%Y%m%d).sql.gz
# Aufbewahrung: letzte 14 Tage
find /backups/ -name "*.sql.gz" -mtime +14 -delete
```

**Step 7: Commit**

```bash
git add docker-compose.prod.yml nginx.conf infrastructure/
git commit -m "feat: finalize Hetzner deployment with SSL and backup"
```

---

## Task 9: Admin-Dashboard einrichten und testen

**Kein Code — Manuelle Konfiguration nach Deployment**

**Step 1: Admin-User anlegen**

```bash
# Im Medusa-Container:
npx medusa user --email admin@seyfarth-container.de --password [sicheres-passwort]
```

**Step 2: Region "Deutschland" einrichten**

Im Admin Dashboard (`/app`):
- Region "Deutschland" erstellen
- Währung: EUR
- Steuersatz: 19% MwSt
- Versandoption: "Containerlieferung" (Flatrate 0 EUR — Preis ist im Produktpreis inkludiert)
- Zahlungsoption: "Manuelle Zahlung / Rechnung"

**Step 3: Produkte prüfen**

- Seed-Script ausführen: `npx medusa exec ./src/scripts/seed-services.ts`
- Alle Produkte im Admin prüfen
- Bilder hochladen (Container-Fotos von Seyfarth)
- Preise verifizieren

**Step 4: Testbestellung durchführen**

Vollständigen Checkout-Flow testen:
1. Produkt in Warenkorb
2. Als Gast bestellen
3. Als registrierter Kunde bestellen
4. Mit GewAbfV-Pflicht bestellen
5. Mit Gefahrstoff bestellen
6. E-Mail-Empfang prüfen (Kunde + Betreiber)

**Step 5: Dokumentation für Schulung erstellen**

Kurze Anleitung (1-2 Seiten) für Seyfarth:
- Wie logge ich mich ins Admin ein?
- Wie sehe ich neue Bestellungen?
- Wie ändere ich Preise?
- Wie füge ich neue Produkte hinzu?
- Wie verwalte ich Kunden?

---

## Task 10: Schulung (0,5 PT vor Ort)

**Kein Code — Termin nach Go-Live**

**Agenda:**
1. **Admin-Dashboard** (30 Min): Login, Navigation, Bestellungen einsehen, Status ändern
2. **Produktverwaltung** (30 Min): Preise ändern, neue Produkte anlegen, Bilder hochladen
3. **Kundenverwaltung** (15 Min): Kunden einsehen, Kundendetails
4. **E-Mail-Benachrichtigungen** (15 Min): Wie funktioniert der E-Mail-Versand, Brevo-Dashboard
5. **FAQ & Fragen** (30 Min): Häufige Fragen, Troubleshooting

---

## Sprint-Plan

```
Woche 1     Task 1 (SMTP E-Mail) + Task 2 (Checkout finalisieren)
Woche 2     Task 3 (DSGVO-Seiten) + Task 4 (Artikelimport)
Woche 3     Task 5 (Design Contentwerke) — BLOCKIERT bis Vorgaben da
Woche 4     Task 6 (Instagram-Links) + Task 7 (Website-Integration)
Woche 5     Task 8 (Hetzner Deployment)
Woche 6     Task 9 (Admin einrichten + Testen)
Woche 7     Puffer + Task 10 (Schulung vor Ort)
```

### Abhängigkeiten

```
Task 5 (Design) ← blockiert durch Contentwerke-Vorgaben
Task 7 (Integration) ← hängt von Domain-Entscheidung ab
Task 8 (Deployment) ← nach Tasks 1-4 (funktionaler Code)
Task 9 (Admin) ← nach Task 8 (Server steht)
Task 10 (Schulung) ← nach Task 9 (alles läuft)
```

### Parallelisierbar

- Task 1 + Task 2 (Backend + Frontend gleichzeitig)
- Task 3 + Task 4 (unabhängige Seiten)
- Task 6 ist fast fertig (nur Polish)
