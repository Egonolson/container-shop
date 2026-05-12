import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getCityForPostalCode, lookupZone } from "./seyfarth-shop-data.ts"

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
