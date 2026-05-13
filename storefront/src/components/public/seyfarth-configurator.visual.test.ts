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


test("onepage images are wired into hero and configurator cards with accessible alt text", () => {
  const pageSource = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8")
  assert.match(pageSource, /8d1f791e-5a8c-4962-bcc6-04dfd1e8d3d3\/md2x/)
  assert.match(pageSource, /Gelber Seyfarth-LKW mit blauem Abrollcontainer im Einsatz/)
  assert.match(source, /439da145-35ef-4382-8044-2fd66d5d373d\/md2x/)
  assert.match(source, /0a1fa9b6-6ca3-4ac5-a57d-7494232709f2\/md2x/)
  assert.match(source, /cf59c78d-e307-4357-b83a-c66be5d710f0\/md2x/)
  assert.match(source, /Seyfarth-Absetzcontainer-LKW für Entsorgungsanfragen/)
  assert.match(source, /Seyfarth-Multicar für kleinere Baustoff- und Materiallieferungen/)
  assert.match(source, /Seyfarth-Abrollcontainer-LKW für größere Transportaufgaben/)
})
