import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const source = readFileSync(new URL("./seyfarth-configurator.tsx", import.meta.url), "utf8")

test("waste selection does not show red hazard markers to customers", () => {
  assert.equal(source.includes("ShieldAlert"), false)
  assert.equal(source.includes("text-red-500"), false)
})

test("hazardous material details are not rendered as red danger notice", () => {
  assert.equal(source.includes("selectedWaste?.notice && <Notice tone=\"danger\""), false)
})
