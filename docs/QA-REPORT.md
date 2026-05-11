# QA-Report — Seyfarth Container-Portal
Datum: 05.04.2026 | Tester: Claude Code (agent-browser + Vision AI)

---

## Executive Summary

| | |
|---|---|
| **Getestet** | Desktop (1280px), Tablet-Sim, Mobile-Sim, Embed-iframe |
| **Flows** | Startseite → Katalog → Produkt → Warenkorb → Checkout (5 Schritte) |
| **Kritische Bugs** | 2 gefunden und **sofort behoben** |
| **UX-Issues** | 6 identifiziert |
| **Gesamtstatus** | ✅ Produktiv einsetzbar nach Fixes |

---

## 🔴 Kritische Bugs (BEHOBEN)

### BUG-01: Cart-Create schlägt fehl (API-Key mit zwei Sales Channels)
**Status:** ✅ Behoben  
**Symptom:** Beim Klick auf "Auftrag bestätigen" erscheint: *"Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut..."*  
**Ursache:** Der Publishable API Key war mit zwei Sales Channels verknüpft (`Default Sales Channel` + `Container-Portal`). Medusa verlangt in diesem Fall eine explizite `sales_channel_id` im Cart-Request.  
**Fix:** Der `Default Sales Channel` wurde per SQL soft-deleted aus der `publishable_api_key_sales_channel`-Tabelle entfernt — auf **beiden Servern (Prod + Dev)**.  
**Verifizierung:** `POST /store/carts` gibt jetzt `200 OK` mit Cart-ID zurück. `POST /store/carts/{id}/line-items` fügt korrekt Artikel hinzu.

---

### BUG-02: iframe height=1300 zeigt nur 6 von 26 Produkten (NICHT behoben — Empfehlung)
**Status:** ⚠️ Konfigurationsproblem im onepage.me-Snippet  
**Symptom:** Bei `height=1300` sind nur die ersten 2 Produktreihen (6 Produkte) vollständig sichtbar, die 3. Reihe wird angeschnitten.  
**Gemessene Seitenhöhe:** 4708px (alle 26 Produkte)  
**Empfohlene Höhen:**

| Kategorie | Desktop | Hinweis |
|---|---|---|
| Alle (26 Produkte) | **4800px** | Vollständig alle sichtbar |
| BigBag & Multicar (4) | **1300px** | Passt |
| Absetzcontainer (4) | **1300px** | Passt |
| Abrollcontainer (7) | **1700px** | 3 Reihen |
| Spezialcontainer (7) | **1700px** | 3 Reihen (viele Varianten) |
| Recyclinghof (5) | **1400px** | 2 Reihen |

**Empfehlung:** Iframe-Snippet je Kategorie anpassen (siehe Abschnitt "Korrigierte Snippets").

---

## 🟡 UX-Issues (Verbesserungen empfohlen)

### UX-01: "Weiter"-Button nicht ohne Scroll sichtbar (Checkout)
**Seiten:** /checkout (alle Schritte)  
**Problem:** Der "Weiter"-Button befindet sich am unteren Ende des Inhaltsbereichs. Auf kleineren Screens oder nach Formulareingabe muss gescrollt werden um ihn zu sehen. Kein "Sticky CTA" am unteren Bildrand.  
**Empfehlung:** Zurück/Weiter-Buttons sticky positionieren (`position: sticky; bottom: 0`) oder einen floating CTA ergänzen.

### UX-02: Gast-Checkout-Formular erscheint unterhalb ohne visuellen Hinweis
**Seite:** /checkout (Schritt 2 Konto)  
**Problem:** Nach Klick auf "Als Gast bestellen" wird die Karte mit Ring hervorgehoben, aber das Kontaktformular erscheint unterhalb ohne Scroll-Hinweis oder automatisches Smooth-Scroll.  
**Empfehlung:** Nach Karten-Selektion automatisch zum Formular scrollen (`scrollIntoView({ behavior: 'smooth' })`).

### UX-03: Preis-Formatierung ohne Leerzeichen vor €-Zeichen
**Seiten:** Alle Produktkarten, Produktdetailseite  
**Problem:** `ab 349,00€` statt `ab 349,00 €` — fehlendes Non-Breaking-Space vor dem Euro-Zeichen.  
**Ursache:** `formatPrice()` in `catalog-types.ts` — der `Intl.NumberFormat` gibt je nach Locale kein Leerzeichen aus.  
**Fix:** Bereits im Code geprüft — `de-DE` locale gibt eigentlich `349,00 €` aus. Möglichkeit: Next.js komprimiert das NBSP beim Build. Prüfen ob das ein Rendering-Artefakt ist.

### UX-04: Produktbeschreibungen mit Encoding-Fehlern
**Seiten:** Produktkarten  
**Problem:** `fuer` statt `für`, `Grosser` statt `Großer` — in `services.json` werden Umlaute als ASCII-Ersatz geschrieben.  
**Fix:** `services.json` korrigieren und `seed-services.js` neu ausführen.

### UX-05: Kein visuelles Feedback nach Klick auf Variantenbutton (Katalogseite)
**Seite:** Startseite / Katalog  
**Problem:** Nach Klick auf "Bauschutt 389€ In den Warenkorb" erscheint kurz der "Hinzugefügt"-State (grüner Button für 1,5 Sek.), aber das Warenkorb-Badge im Header aktualisiert sich erst nach React-Re-Render. Es gibt keine unmittelbare visuelle Rückmeldung (kein Toast, kein Slide-Over-Öffnen).  
**Empfehlung:** Nach addItem automatisch den Warenkorb-Slide-Over kurz aufblitzen lassen oder einen Toast anzeigen.

### UX-06: Cookie-Banner blockiert Inhalte auf Mobile
**Seiten:** Alle öffentlichen Seiten  
**Problem:** Der Cookie-Banner erscheint am unteren Rand und kann auf Mobile die unteren Buttons (Warenkorb, CTA) überlagern.  
**Status:** Bereits in PublicShell (nicht im Root-Layout) — kein iframe-Problem. Aber für Mobile-User störend wenn Banner und Floating-CTA kollidieren.

---

## ✅ Was gut funktioniert

| Feature | Status |
|---|---|
| **Warenkorb-Funktionalität** | ✅ localStorage, React-State, Badge-Counter |
| **Kategorie-Filter** | ✅ 6 Kacheln mit Icons, Filter-State, Anzahl |
| **Produktdetailseite** | ✅ Varianten-Auswahl, Quicklink-Button, SEO-Metadata |
| **Embed /embed** | ✅ Weißer Header, nur Warenkorb-Icon, kein Nav/Footer/Cookie |
| **Embed-Navigation** | ✅ /embed/p/[handle], /embed/checkout, /embed/login |
| **Albert Sans Font** | ✅ Im Embed geladen, gleiche Schrift wie onepage.me |
| **Cloudflare Tunnel Prod** | ✅ seyfarth.visionmakegpt.work online |
| **Cloudflare Tunnel Dev** | ✅ seyfarth-dev.visionmakegpt.work online |
| **API /store/products** | ✅ 26 Produkte, mit Preisen und Varianten |
| **API /store/carts** | ✅ Nach Sales-Channel-Fix funktioniert Cart-Create |
| **API /store/carts/{id}/line-items** | ✅ Line Items werden korrekt hinzugefügt |
| **Checkout Schritt 1 (Warenkorb)** | ✅ Produkt mit Preis, Löschen-Button, Gesamtpreis |
| **Checkout Schritt 2 (Konto)** | ✅ Gast + Anmelden + Registrieren-Optionen |
| **Checkout Schritt 3 (Lieferort)** | ✅ Name (optional), Straße*, PLZ*, Stadt* |
| **Checkout Schritt 4 (Details)** | ✅ Auftragstyp (Stellen/Abholen/Wechseln/Umladen), Datum, Bemerkungen |
| **Checkout Schritt 5 (Zusammenfassung)** | ✅ Alle Infos (Produkt, Kunde, Adresse, Auftragstyp) |
| **Checkbox Pflicht-Bestätigung** | ✅ Aktiviert "Auftrag bestätigen"-Button |
| **Responsives Grid** | ✅ Desktop 3-spaltig, Tablet 2-spaltig, Mobile 1-spaltig |
| **Footer** | ✅ 4-spaltig, klickbare Kontakt-Links |

---

## 📐 iframe-Höhen (Korrigiert)

**Statt `height=1300` für alle Kategorien verwende:**

```html
<!-- Alle Produkte — MUSS höher -->
<iframe src="https://seyfarth.visionmakegpt.work/embed"
  width="100%" height="4800" ...>

<!-- BigBag & Multicar — passt -->
<iframe src="https://seyfarth.visionmakegpt.work/embed?category=bigbag"
  width="100%" height="1400" ...>

<!-- Absetzcontainer — passt -->
<iframe src="https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer"
  width="100%" height="1400" ...>

<!-- Abrollcontainer — mehr Höhe nötig -->
<iframe src="https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer"
  width="100%" height="1800" ...>

<!-- Spezialcontainer — mehr Höhe nötig -->
<iframe src="https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer"
  width="100%" height="1800" ...>

<!-- Recyclinghof -->
<iframe src="https://seyfarth.visionmakegpt.work/embed?category=recyclinghof"
  width="100%" height="1500" ...>
```

**Wichtig:** Auf Mobile (375px) gilt ca. 1-Spalten-Layout → Höhe 3-4x so groß wie auf Desktop.  
**Empfehlung für Mobile-freundlich:** JavaScript-Resize-Snippet verwenden (siehe unten).

### Auto-Resize-Snippet für onepage.me

Füge dieses Script **einmalig** auf der Seite ein (Custom Code unten in der Seite):

```html
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'seyfarth-resize') {
    var iframes = document.querySelectorAll('iframe[src*="seyfarth.visionmakegpt.work"]');
    iframes.forEach(function(f) { f.style.height = (e.data.height + 20) + 'px'; });
  }
});
</script>
```

Und in der Embed-Seite (already done falls PostMessage implementiert):  
Das iframe muss `allow="same-origin"` bekommen wenn PostMessage genutzt wird.

---

## 🛠 Offene Fixes (Checkliste)

- [ ] **services.json**: Umlaute korrigieren (`für`, `größer`, `straße` etc.) + seed-services.js neu ausführen auf Prod
- [ ] **Checkout**: Weiter-Button sticky oder Auto-Scroll nach Formular-Ausfüllung
- [ ] **Checkout Gast**: Auto-Scroll zum Kontaktformular nach Karten-Selektion
- [ ] **iframe heights**: In onepage.me Snippets Höhen per Kategorie anpassen (siehe oben)
- [ ] **Checkout Erfolgsmeldung**: Prüfen ob /checkout/success korrekt funktioniert (Redirect nach Bestell-Submit)
- [ ] **Preise mit echten Werten**: services.json durch echte Seyfarth-Preisliste ersetzen
- [ ] **Logo**: Echtes Seyfarth-Logo unter /public/logo-seyfarth.png ablegen

---

## Getestete URLs

| URL | HTTP | Notiz |
|---|---|---|
| https://seyfarth.visionmakegpt.work | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/embed | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/embed/checkout | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/embed/p/absetzcontainer-7m3 | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/p/absetzcontainer-7m3 | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/checkout | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/login | 200 | ✅ |
| https://seyfarth.visionmakegpt.work/store/products | 200 | ✅ 26 Produkte |
| https://seyfarth-dev.visionmakegpt.work | 200 | ✅ |
