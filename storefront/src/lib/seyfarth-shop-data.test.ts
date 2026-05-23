import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getCityForPostalCode, lookupZone, materialItems, wasteItems } from "./seyfarth-shop-data.ts"

describe("Seyfarth PLZ-Ort-Zuordnung", () => {
  it("zieht den Ort automatisch aus einer eindeutigen PLZ", () => {
    assert.equal(getCityForPostalCode("07545"), "Gera")
    assert.equal(lookupZone("07545", getCityForPostalCode("07545") ?? undefined)?.zone, 2)
  })

  it("liefert keinen Ort fuer unbekannte oder unvollstaendige PLZ", () => {
    assert.equal(getCityForPostalCode("99999"), null)
    assert.equal(getCityForPostalCode("0754"), null)
  })
})


describe("Seyfarth Produktdaten", () => {
  it("enthält die fachlich gelieferten Entsorgungsarten als auswählbare Daten", () => {
    const names = new Set(wasteItems.map((item) => item.name))
    const requiredNames = [
      "Erdaushub / Lehm",
      "Mutterboden zur Verwertung",
      "Bauschutt-Erde-Gemisch",
      "Bauschutt verunreinigt (bis 10%)",
      "Bauschutt stark verunreinigt (bis 50%) (Polterabend)",
      "Beton größer 80 cm mit Armierung",
      "Asphalt / Straßenaufbruch",
      "Bauschutt mit Schwarz- / Bitumenanstrich / Anhaftungen",
      "Schlacke / Schüttung",
      "Schornstein-, Essen-Schutt",
      "Steinholzfußboden / -estrich",
      "Wurzelstubben",
      "HWL-Platten / Sauerkrautplatten",
      "Mineralwolle / Dämmwolle nicht gefährlich (gelb)",
      "Friedhofsabfälle",
      "Siedlungsabfälle / Gewerbeabfälle",
      "Pappe und Papier",
      "Flachglas / Fensterglas (sauber)",
      "Dachpappe bitumenhaltig",
      "Platten-Big-Bag (für Asbest)",
      "Sack-Big-Bag (für Baustellenabfälle und Asbest)",
    ]

    assert.deepEqual(requiredNames.filter((name) => !names.has(name)), [])
  })

  it("führt prüfpflichtige Sonderfälle als Anfrage-only ohne sichtbaren Festpreis", () => {
    const inquiryOnlyNames = [
      "Bauschutt verunreinigt (bis 10%)",
      "Bauschutt verunreinigt (bis 25%)",
      "Bauschutt stark verunreinigt (bis 50%)",
      "Bauschutt stark verunreinigt (bis 50%) (Polterabend)",
      "Dachpappe teerhaltig",
      "Asbest / asbesthaltige Baustoffe",
      "Platten-Big-Bag (für Asbest)",
      "Sack-Big-Bag (für Baustellenabfälle und Asbest)",
    ]

    for (const name of inquiryOnlyNames) {
      const item = wasteItems.find((entry) => entry.name === name)
      assert.equal(item?.paymentMode, "inquiry_only", name)
    }
  })

  it("enthält die gelieferten Baustoffe und Recyclingmaterialien mit Preisangaben", () => {
    const byName = new Map(materialItems.map((item) => [item.name, item]))
    assert.equal(byName.get("Humus")?.netPrice, 26)
    assert.equal(byName.get("Pflanzerde")?.netPrice, 26)
    assert.equal(byName.get("Ziegelrecycling")?.netPrice, 1)
    assert.equal(byName.get("Asphaltrecycling")?.netPrice, 4)
    assert.equal(byName.get("Splitt Diabas (Wegebau)")?.netPrice, 38)
    assert.equal(byName.get("Mineralstoffgemisch")?.specification, "0/32")
  })
})
