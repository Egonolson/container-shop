# Seyfarth Container-Portal — onepage.me Integration

## URLs

| System | URL |
|--------|-----|
| Vollständiger Shop (Prod) | https://seyfarth.visionmakegpt.work |
| Vollständiger Shop (Dev) | https://seyfarth-dev.visionmakegpt.work |
| Katalog-Embed (alle) | https://seyfarth.visionmakegpt.work/embed |
| Katalog-Embed (Absetzcontainer) | https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer |
| Katalog-Embed (Abrollcontainer) | https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer |
| Katalog-Embed (BigBag) | https://seyfarth.visionmakegpt.work/embed?category=bigbag |
| Katalog-Embed (Spezial) | https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer |
| Katalog-Embed (Recyclinghof) | https://seyfarth.visionmakegpt.work/embed?category=recyclinghof |

## Produkt-Quicklinks (Direkt auf Produktseite)

| Produkt | Link |
|---------|------|
| Absetzcontainer 3m³ | https://seyfarth.visionmakegpt.work/p/absetzcontainer-3m3 |
| Absetzcontainer 5m³ | https://seyfarth.visionmakegpt.work/p/absetzcontainer-5m3 |
| Absetzcontainer 7m³ | https://seyfarth.visionmakegpt.work/p/absetzcontainer-7m3 |
| Absetzcontainer 10m³ | https://seyfarth.visionmakegpt.work/p/absetzcontainer-10m3 |
| Abrollcontainer 10m³ | https://seyfarth.visionmakegpt.work/p/abrollcontainer-10m3 |
| Abrollcontainer 15m³ | https://seyfarth.visionmakegpt.work/p/abrollcontainer-15m3 |
| Abrollcontainer 20m³ | https://seyfarth.visionmakegpt.work/p/abrollcontainer-20m3 |
| Abrollcontainer 30m³ | https://seyfarth.visionmakegpt.work/p/abrollcontainer-30m3 |
| Abrollcontainer 36m³ | https://seyfarth.visionmakegpt.work/p/abrollcontainer-36m3 |
| BigBag 1m³ | https://seyfarth.visionmakegpt.work/p/bigbag-1m3 |
| BigBag 2m³ | https://seyfarth.visionmakegpt.work/p/bigbag-2m3 |
| BigBag 3m³ | https://seyfarth.visionmakegpt.work/p/bigbag-3m3 |
| Asbest-Entsorgung | https://seyfarth.visionmakegpt.work/p/asbest-big-bag |
| KMF-Container | https://seyfarth.visionmakegpt.work/p/kmf-container |
| Dachpappe-Container | https://seyfarth.visionmakegpt.work/p/dachpappe-container-7m3 |

---

## onepage.me Integration — HTML-Snippets

onepage.me erlaubt Custom-HTML in jedem Abschnitt unter:
Abschnitt bearbeiten → "Custom Code" → HTML einfügen

---

### SNIPPET 1: Voller Katalog (iframe)

Zeigt den kompletten Shop mit allen Kategorien und Produkten.
Höhe anpassen je nach Inhalt (1800px empfohlen).

```html
<!-- Seyfarth Container-Portal — Vollständiger Katalog -->
<div style="width:100%; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed"
    width="100%"
    height="1800"
    frameborder="0"
    scrolling="auto"
    allow="payment"
    title="Seyfarth Container-Portal"
    style="display:block; border:none;"
    loading="lazy"
  ></iframe>
</div>
```

---

### SNIPPET 2: Nur Absetzcontainer (iframe)

```html
<!-- Seyfarth — Absetzcontainer Katalog -->
<div style="width:100%; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer"
    width="100%"
    height="1200"
    frameborder="0"
    scrolling="auto"
    allow="payment"
    title="Absetzcontainer bestellen"
    style="display:block; border:none;"
    loading="lazy"
  ></iframe>
</div>
```

---

### SNIPPET 3: Nur Abrollcontainer (iframe)

```html
<!-- Seyfarth — Abrollcontainer Katalog -->
<div style="width:100%; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer"
    width="100%"
    height="1400"
    frameborder="0"
    scrolling="auto"
    allow="payment"
    title="Abrollcontainer bestellen"
    style="display:block; border:none;"
    loading="lazy"
  ></iframe>
</div>
```

---

### SNIPPET 4: BigBag & Multicar (iframe)

```html
<!-- Seyfarth — BigBag Katalog -->
<div style="width:100%; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.1);">
  <iframe
    src="https://seyfarth.visionmakegpt.work/embed?category=bigbag"
    width="100%"
    height="1000"
    frameborder="0"
    scrolling="auto"
    allow="payment"
    title="BigBag bestellen"
    style="display:block; border:none;"
    loading="lazy"
  ></iframe>
</div>
```

---

### SNIPPET 5: CTA-Buttons (Direktlinks zu Kategorien)

Für eine Section mit Buttons die direkt in den Shop springen:

```html
<!-- Seyfarth — Container-Kategorie Buttons -->
<style>
  .sey-btn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 16px;
    font-family: system-ui, sans-serif;
  }
  .sey-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 20px 16px;
    border-radius: 16px;
    background: white;
    border: 2px solid #e5e7eb;
    text-decoration: none;
    color: #273582;
    font-weight: 600;
    font-size: 14px;
    text-align: center;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .sey-btn:hover {
    border-color: #273582;
    background: #273582;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(39,53,130,0.2);
  }
  .sey-btn-icon { font-size: 28px; }
  .sey-btn-count { font-size: 11px; font-weight: normal; opacity: 0.6; }
  .sey-cta {
    text-align: center;
    margin-top: 20px;
    font-family: system-ui, sans-serif;
  }
  .sey-cta-btn {
    display: inline-block;
    padding: 14px 32px;
    background: #fbb900;
    color: #273582;
    font-weight: 700;
    font-size: 15px;
    border-radius: 9999px;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(251,185,0,0.3);
    transition: all 0.2s;
  }
  .sey-cta-btn:hover { background: #f8f32b; transform: translateY(-1px); }
</style>

<div class="sey-btn-grid">
  <a href="https://seyfarth.visionmakegpt.work/embed?category=bigbag" target="_blank" class="sey-btn">
    <span class="sey-btn-icon">🧺</span>
    <span>BigBag &amp; Multicar</span>
    <span class="sey-btn-count">1 – 3 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=absetzcontainer" target="_blank" class="sey-btn">
    <span class="sey-btn-icon">📦</span>
    <span>Absetzcontainer</span>
    <span class="sey-btn-count">3 – 10 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=abrollcontainer" target="_blank" class="sey-btn">
    <span class="sey-btn-icon">🚛</span>
    <span>Abrollcontainer</span>
    <span class="sey-btn-count">7 – 40 m³</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=spezialcontainer" target="_blank" class="sey-btn">
    <span class="sey-btn-icon">⚠️</span>
    <span>Spezialcontainer</span>
    <span class="sey-btn-count">Gefahrstoffe</span>
  </a>
  <a href="https://seyfarth.visionmakegpt.work/embed?category=recyclinghof" target="_blank" class="sey-btn">
    <span class="sey-btn-icon">♻️</span>
    <span>Recyclinghof</span>
    <span class="sey-btn-count">Direktanlieferung</span>
  </a>
</div>

<div class="sey-cta">
  <a href="https://seyfarth.visionmakegpt.work" target="_blank" class="sey-cta-btn">
    🛒 Zum vollständigen Bestellshop
  </a>
</div>
```

---

### SNIPPET 6: Einzelner Produkt-Button (Quicklink)

Für spezifische Produkte z.B. auf der Containerdienst-Seite:

```html
<!-- Einzelner Container Quicklink -->
<style>
  .sey-product-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 28px;
    background: #273582;
    color: white;
    font-family: system-ui, sans-serif;
    font-weight: 600;
    font-size: 15px;
    border-radius: 12px;
    text-decoration: none;
    box-shadow: 0 4px 16px rgba(39,53,130,0.25);
    transition: all 0.2s;
  }
  .sey-product-link:hover {
    background: #fbb900;
    color: #273582;
    transform: translateY(-2px);
  }
</style>

<!-- Absetzcontainer 7m³ direkt bestellen -->
<a href="https://seyfarth.visionmakegpt.work/p/absetzcontainer-7m3" target="_blank" class="sey-product-link">
  📦 Absetzcontainer 7 m³ — ab 349 € bestellen
</a>

<!-- Weitere Beispiele (nach Bedarf anpassen): -->
<!--
<a href="https://seyfarth.visionmakegpt.work/p/abrollcontainer-20m3" target="_blank" class="sey-product-link">
  🚛 Abrollcontainer 20 m³ — ab 649 € bestellen
</a>
<a href="https://seyfarth.visionmakegpt.work/p/bigbag-1m3" target="_blank" class="sey-product-link">
  🧺 BigBag 1 m³ — ab 69 € bestellen
</a>
-->
```

---

## Hinweise für onepage.me

1. **Iframe-Höhe**: Die Höhe manuell anpassen — Absetzcontainer ~1200px, voller Katalog ~2000px
2. **Mobile**: iframes funktionieren auf Mobile gut wenn `scrolling="auto"` gesetzt ist
3. **Kategorie-Buttons** (Snippet 5) empfohlen wenn kein iframe gewünscht — öffnen Shop in neuem Tab
4. **CORS**: Bereits konfiguriert, kein weiterer Setup nötig
5. **Direkte Links** öffnen immer in `_blank` (neues Tab) — kein Verlassen der onepage-Seite
