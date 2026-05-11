# Seyfarth Own-Shop Preislisten- und Produktmodell

Stand: 2026-05-11

## Ziel

Containerdienst Seyfarth soll perspektivisch nicht mehr von Medusa als Shop-/Produkt-Backend abhängen. Die gelieferten Preislisten bilden die fachliche Grundlage für ein eigenes, schlankes Shopsystem mit geführtem Bestellflow ähnlich ecoservice24.

## Eingangsdateien

- `04_2026 Preisliste_Abfall_neu.xlsx` — Entsorgung / Verwertungskosten
- `04_2026 Preisliste_Baustoffe_neu.docx` — Lieferung Baustoffe und Recyclingmaterial
- `04_2026 Preislisten ZONE nach Plz+Orte.xlsx` — Transportzonen nach PLZ/Ort

## Extraktionsergebnis

| Bereich | Ergebnis |
|---|---:|
| Entsorgungs-/Abfallpositionen | 42 |
| Baustoff-/Schüttgutpositionen | 18 |
| PLZ-/Ort-Zoneneinträge | 258 |
| Preiszonen | 1 bis 3 |

## Fachliches Modell

### Entsorgung

Entsorgungspositionen sind keine klassischen Varianten eines Produktes, sondern Abfallarten mit Preislogik.

Pflichtfelder:

- Name der Abfallart
- ASN / Abfallschlüssel
- Netto-Verwertungspreis
- Preiseinheit: meistens `t`, teils `Stück` oder `m³`
- Gefahrstoffkennzeichnung, wenn ASN mit `*` oder fachlich relevant
- optionale Bearbeitungsgebühren, z. B. Asbest, Mineralwolle, teerhaltige Dachpappe

Beispiele:

- Bauschutt rein — ASN 170107 — 23,50 €/t netto
- Sperrmüll — ASN 200307 — 266,50 €/t netto
- Mineral-Dämmwolle — ASN 170603* — 790,00 €/t netto + Bearbeitungsgebühr
- Asbest — ASN 170605* — 280,00 €/t netto + Bearbeitungsgebühr
- Platten Big-Bag — Stückpreis 15,50 € netto

### Baustoffe / Schüttgut

Baustoffe sind Lieferartikel mit Material, Körnung und Preis pro t oder m³.

Pflichtfelder:

- Kategorie, z. B. Erden, Recyclingmaterial, Splitt und Steine, Sande, Kiese
- Materialname
- Körnung / Spezifikation
- Netto-Preis
- Einheit: `t` oder `m³`

Beispiele:

- Kulturboden — 0/15 gesiebt — 15,90 €/t netto
- Rindenmulch — geschreddert — 44,00 €/m³ netto
- Betonrecycling — 0/45 gebrochen — 8,00 €/t netto
- Frostschutzkies — 0/32 mit Zertifikat — 19,50 €/t netto

### Transport / Zone

Die Zonenliste ist die zentrale Preiskomponente für Lieferung/Abholung.

Pflichtfelder:

- PLZ
- Ort
- Preiszone 1, 2 oder 3
- Containergestellung je Fahrzeug-/Containerart
- Schüttgut-Lieferung je Fahrzeug-/Containerart

Preiszonen:

| Zone | Multicar | Absetzcontainer | Abroll 5–7 m³ | Abroll 10–12 m³ | Abroll 15–40 m³ | Schüttgut Multicar | Schüttgut Absetzer | Schüttgut Abroller |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 89 | 104 | 104 | 135 | 135 | 60 | 75 | 80 |
| 2 | 95 | 115 | 115 | 145 | 145 | 65 | 80 | 85 |
| 3 | 99 | 125 | 125 | 158 | 158 | 75 | 85 | 90 |

## Empfohlener Shop-Aufbau nach ecoservice24-Logik

### Einstiegsflow Entsorgung

1. Abfallart wählen
2. PLZ/Ort eingeben
3. Containergröße und Containerart wählen
4. Stellplatz auswählen: privat oder öffentlich
5. Termin / Lieferfenster angeben
6. Kundendaten erfassen
7. Anfrage oder Bestellung absenden

### Einstiegsflow Baustoffe

1. Baustoff / Material wählen
2. Menge eingeben
3. PLZ/Ort eingeben
4. Lieferart bestimmen
5. Termin / Lieferfenster angeben
6. Anfrage oder Bestellung absenden

## Preisformel MVP

### Entsorgung

`Gesamt netto = Transport/Gestellung nach Zone + erwartete Verwertungskosten + optionale Zusatz-/Bearbeitungsgebühren`

Da Verwertungskosten pro Tonne berechnet werden, braucht das MVP eine Entscheidung:

- Variante A: Anfragepreis anzeigen: Transport fix, Entsorgung nach Verwiegung.
- Variante B: Festpreis mit pauschaler Inklusivtonnage je Containergröße.
- Variante C: Kunde gibt geschätzte Menge ein; Endabrechnung nach Verwiegung.

Empfehlung für Seyfarth-MVP: Variante A oder C, damit keine falschen Festpreise entstehen.

### Baustoffe

`Gesamt netto = Materialpreis * Menge + Lieferpreis nach Zone/Fahrzeug`

## Datenmodell-Vorschlag

- `price_list_versions`
- `waste_items`
- `building_material_items`
- `transport_zones`
- `zone_locations`
- `container_types`
- `shop_requests`
- `shop_request_items`
- `customers`
- `delivery_addresses`

## Medusa-Ablösung

Medusa ist für diese Domäne zu generisch und bildet die Seyfarth-Preislogik nur umständlich ab. Sinnvoller ist ein eigenes Domain-Modell, weil Preise von Abfallart, ASN, Containerart, PLZ/Zone, Menge, Gefahrstoffregeln und Transportart abhängen.

Empfohlene Zwischenstrategie:

1. Medusa-Produktlisten im öffentlichen Katalog ablösen.
2. Preislisten als eigene JSON/DB-Quelle importieren.
3. Warenkorb als Anfragekorb im eigenen System führen.
4. Checkout zunächst als Angebots-/Bestellanfrage ohne Onlinezahlung umsetzen.
5. Medusa danach aus Checkout, Portal und Auth-Pfaden entfernen.

## Security-/Compliance-Mindestpunkte

- Gefahrstoffe sichtbar kennzeichnen und gesonderte Hinweise erzwingen.
- Keine Gefahrstoff-Bestellung ohne Bestätigung der Verpackungs-/Annahmebedingungen.
- Preislisten-Version pro Anfrage speichern.
- Netto/Brutto sauber getrennt speichern.
- Endpreis bei tonnageabhängigen Abfällen nicht als final ausgeben, wenn nach Verwiegung abgerechnet wird.
- Kundendaten und Lieferadressen serverseitig validieren.
- Admin-Import nur geschützt und auditierbar erlauben.



## Verbindliche Produktentscheidungen vom Nutzer

Stand: 2026-05-11

### 1. Anfrage, Bestellung und Zahlung

Seyfarth soll sowohl **Anfragen** als auch **Bestellungen** ermöglichen.

Für Container-/Entsorgungsleistungen gilt im Standard:

- Kunde kann online anfragen oder bestellen.
- Bezahlt wird **vor Ort bzw. nachgelagert**, weil die endgültige Abrechnung erst nach Verwiegung möglich ist.
- Der Shop darf bei tonnageabhängigen Entsorgungen keinen endgültigen Online-Festpreis erzwingen.
- Die Bestellung muss die Preisbasis, Preislisten-Version, Abfallart, Containergröße, Zone und Hinweise speichern.

Für spätere Festpreisprodukte gilt:

- Zahlungsarten müssen **pro Produkt bzw. Produktart im Backend einstellbar** sein.
- Mögliche Zahlungsarten:
  - Onlinezahlung
  - Rechnung
  - Vor-Ort-Zahlung
- Onlinezahlung soll bei Bedarf über **Mollie** angebunden werden.
- Mollie ist nur für Produkte/Leistungen aktiv, bei denen ein finaler Festpreis vor Checkout feststeht.

### 2. Festpreise

- Baustoffe dürfen als Festpreis pro Einheit angeboten werden, entsprechend der Preislisten-Einheit (`t` oder `m³`).
- Entsorgung bleibt in der Regel verwiegungsabhängig; sichtbare Preise müssen entsprechend als Basis-/Transport-/Schätzpreise oder „zzgl. Verwertung nach Verwiegung“ kommuniziert werden.

### 3. Containergrößen je Abfallart

- Grundsätzlich sind alle Containergrößen erlaubt.
- Die erlaubten Containergrößen müssen aber im Backend **je Abfallart einstellbar** sein.
- Damit kann Seyfarth später fachlich einschränken, welche Abfallart in welchen Container darf.

### 4. Gefahrstoff- und Pflicht-Hinweise

Mindestens folgende Abfälle brauchen besondere Hinweise/Bestätigungen:

- Asbest
- Mineralwolle / KMF
- teerhaltige Dachpappe
- kontaminierte Stoffe

Die Liste darf nicht hardcoded bleiben, sondern muss im Adminbereich pflegbar sein.

Pro Abfallart sollen im Backend einstellbar sein:

- Gefahrstoffkennzeichen
- Pflicht-Hinweistext
- erforderliche Verpackung, z. B. Big Bag / Platten-Big-Bag
- Pflichtbestätigung vor Bestellung
- optionale Bearbeitungsgebühren
- erlaubte Containergrößen

### 5. Öffentliche Stellfläche / Genehmigung

Der Bestellflow muss abfragen, ob der Container auf privater oder öffentlicher Fläche steht.

- Private Fläche: normale Bestellung möglich.
- Öffentliche Fläche: Hinweis auf Genehmigung / Sondernutzung erforderlich.
- Die Antwort muss in Anfrage/Bestellung gespeichert werden.
- Später kann daraus ein eigener Genehmigungsservice oder Hinweisprozess entstehen.

## Aktualisiertes MVP-Zielbild nach Entscheidungen

### Standard-Flow Entsorgung

```text
Abfallart wählen
→ PLZ / Ort eingeben
→ Zone automatisch bestimmen
→ Containergröße wählen
→ Stellplatz privat/öffentlich wählen
→ Gefahrstoff-/Pflichthinweise bestätigen, falls erforderlich
→ Terminwunsch und Kontaktdaten erfassen
→ Anfrage oder Bestellung absenden
→ Zahlung vor Ort/nach Verwiegung
```

### Standard-Flow Baustoffe

```text
Baustoff wählen
→ Menge und Einheit eingeben
→ PLZ / Ort eingeben
→ Lieferpreis nach Zone berechnen
→ Zahlungsarten nach Produktkonfiguration anzeigen
→ Anfrage oder Bestellung absenden
```

### Zahlungslogik

```text
if product.requires_weighing:
  payment_methods = ["vor_ort"]
  mollie_enabled = false
elif product.fixed_price:
  payment_methods = configured_product_payment_methods
  mollie_enabled = "online" in payment_methods
```

## Ergänztes Datenmodell

Zusätzlich zum Basisdatenmodell werden benötigt:

### `payment_method_settings`

```ts
{
  id: string
  scope_type: "product" | "category" | "global"
  scope_id: string | null
  allow_online_payment: boolean
  allow_invoice: boolean
  allow_pay_on_site: boolean
  mollie_enabled: boolean
}
```

### `waste_item_rules`

```ts
{
  waste_item_id: string
  allowed_container_type_ids: string[]
  is_hazardous: boolean
  requires_confirmation: boolean
  confirmation_text: string | null
  packaging_required: string | null
  extra_fee_net: number | null
  extra_fee_unit: "order" | "t" | "m3" | "piece" | null
}
```

### `shop_requests` Erweiterung

```ts
{
  request_kind: "inquiry" | "order"
  payment_mode: "pay_on_site" | "invoice" | "online_mollie" | null
  requires_weighing: boolean
  public_space: boolean
  public_space_permit_note_acknowledged: boolean
  price_is_final: boolean
  price_list_version_id: string
}
```

## Konsequenz für die Medusa-Ablösung

Die neuen Entscheidungen bestätigen die Ablösung von Medusa:

- Medusa ist für produktweise Zahlungsarten, Verwiegungslogik, Gefahrstoffregeln und PLZ-Zonenpreise nur mit Workarounds geeignet.
- Das eigene Shop-System braucht eine regelbasierte Domain-Logik statt klassischer Variantenpreise.
- Mollie sollte nicht global im Checkout hängen, sondern nur bei festpreisfähigen Produkten aktiviert werden.

## Offene fachliche Entscheidungen

- Soll Entsorgung als Festpreis oder als Anfrage mit Abrechnung nach Verwiegung laufen?
- Welche Containergrößen sind je Abfallart erlaubt?
- Welche Abfälle dürfen in welchen Containerarten nicht angeboten werden?
- Ist Onlinezahlung gewünscht oder zunächst Anfrage/Bestellung auf Rechnung?
- Wie werden öffentliche Stellflächen/Genehmigungen behandelt?

## Umsetzungsstand Design-/Shop-Migration 2026-05-11

Die öffentliche Storefront wurde auf der DEV-Umgebung von generischen Medusa-Produktkarten auf einen eigenen Seyfarth-Anfragekonfigurator umgestellt.

Umgesetzt:

- Startseite im Seyfarth-/Hauptseiten-Look mit Blau/Gelb, Logo, Hero, Trust-Karten und CTA-Flächen.
- Eigene Preislisten-/Zonen-/Artikelquelle in `storefront/src/lib/seyfarth-shop-data.ts`.
- Neuer geführter Flow in `storefront/src/components/public/seyfarth-configurator.tsx` für Entsorgung, Baustoffe und Transport.
- Anfrage-API `storefront/src/app/api/shop-requests/route.ts` mit Pflichtfeld-/Datenschutzvalidierung und Referenznummer.
- Öffentlicher Checkout auf Konfigurator-Einstieg reduziert; keine Medusa-Warenkorbpflicht mehr im öffentlichen Hauptflow.
- Auth-Provider im öffentlichen Flow entschärft, damit keine Medusa-Runtime-Calls den öffentlichen Einstieg blockieren.
- Sticky-Header-Fix für die Erfolgssektion: Nach Anfrageabschluss wird die Bestätigung mit Offset sichtbar positioniert.

Verifikation:

- `npm run build` in `storefront/`: erfolgreich, Next.js/TypeScript Build ohne Fehler.
- `git diff --check`: ohne Ausgabe.
- DEV-Deploy auf `seyfarth-dev.visionmakegpt.work`: `seyfarth-storefront:dev` neu gebaut und Container neu gestartet.
- Browser-QA Happy Path Entsorgung: Referenz `SEY-20260511-BBBAA614` erzeugt.
- DOM-QA: Erfolgsbox sichtbar, Sticky-Header überlappt weder Karte noch Überschrift, horizontales Overflow `0`.
- Browser-Konsole nach QA: keine JS-Fehler.

Offene Punkte:

- Vollständige Persistenz/Auftragsverwaltung im Backend ist noch nicht umgesetzt; die MVP-API validiert und bestätigt die Anfrage.
- Zahlungsarten/Mollie bleiben bewusst nur für spätere echte Festpreisprodukte relevant.
- Admin-Pflege von Gefahrstoffhinweisen, Containergrößen je Abfallart und Preislistenimport ist Folgephase.
