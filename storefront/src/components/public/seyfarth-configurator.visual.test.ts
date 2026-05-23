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


test("public page no longer references stale builder image ids", () => {
  const pageSource = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8")
  for (const staleId of [
    "8d1f791e-5a8c-4962-bcc6-04dfd1e8d3d3",
    "439da145-35ef-4382-8044-2fd66d5d373d",
    "0a1fa9b6-6ca3-4ac5-a57d-7494232709f2",
    "cf59c78d-e307-4357-b83a-c66be5d710f0",
  ]) {
    assert.equal(pageSource.includes(staleId) || source.includes(staleId), false, staleId)
  }
})

test("mobile page hides the explanatory section above the wizard", () => {
  const pageSource = readFileSync(new URL("../../app/page.tsx", import.meta.url), "utf8")
  assert.match(pageSource, /<section className="hidden bg-\[#F3F7FB\] py-24 md:block">/)
  assert.match(pageSource, /Welchen <span className="text-seyfarth-yellow">Container<\/span> brauchen Sie\?/)
  assert.doesNotMatch(pageSource, /<section className="bg-\[#F3F7FB\] py-24">/)
})

test("selection step has customer friendly search filters for waste and materials", () => {
  assert.match(source, /const \[wasteSearch, setWasteSearch\] = useState\(""\)/)
  assert.match(source, /filteredWasteItems/)
  assert.match(source, /aria-label="Abfallart suchen"/)
  assert.match(source, /const \[materialSearch, setMaterialSearch\] = useState\(""\)/)
  assert.match(source, /filteredMaterialItems/)
  assert.match(source, /aria-label="Baustoff suchen"/)
})

test("wizard moves focus to the current step heading and announces progress", () => {
  assert.match(source, /const stepHeadingRef = useRef<HTMLHeadingElement \| null>\(null\)/)
  assert.match(source, /stepHeadingRef\.current\?\.focus\(\)/)
  assert.match(source, /aria-live="polite"/)
  assert.match(source, /Schritt \{currentStepIndex \+ 1\} von \{steps\.length\}/)
  assert.match(source, /tabIndex=\{-1\}/)
})

test("mobile primary actions and choice cards use large tap targets", () => {
  assert.match(source, /flex flex-col-reverse[^"]*sm:flex-row/)
  assert.match(source, /w-full sm:w-auto/)
  assert.match(source, /min-h-\[52px\]/)
  assert.match(source, /min-h-12/)
})


test("inquiry-only waste items do not render a zero-euro disposal price", () => {
  assert.match(source, /item\.paymentMode === "inquiry_only"/)
  assert.match(source, /Preis nach persönlicher Prüfung/)
})


test("mobile wizard uses compact stepper instead of wide desktop pills", () => {
  assert.match(source, /const currentStepIndex = stepIndex\(step\)/)
  assert.match(source, /const progressPercent = Math\.round/)
  assert.match(source, /rounded-2xl[^"]*border[^"]*bg-white[^"]*md:hidden/)
  assert.match(source, /Schritt \{currentStepIndex \+ 1\} von \{steps\.length\}/)
  assert.match(source, /hidden[^"]*md:flex/)
  assert.doesNotMatch(source, /mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Fortschritt der Anfrage"/)
})

test("mobile configurator shell prevents page-level horizontal overflow", () => {
  assert.match(source, /id="katalog" className="[^"]*overflow-x-clip/)
  assert.match(source, /mx-auto w-full max-w-\[1180px\] min-w-0 px-4/)
  assert.match(source, /grid min-w-0 gap-4 lg:grid-cols-\[minmax\(0,1fr\)_360px\]/)
  assert.match(source, /className="[^"]*min-w-0[^"]*rounded-\[28px\][^"]*bg-white/)
  assert.match(source, /className="[^"]*hidden h-fit[^"]*lg:block/)
})

test("mobile wizard starts without the intro hero block", () => {
  assert.match(source, /<section id="katalog" className="overflow-x-clip bg-white py-4 md:py-24"/)
  assert.match(source, /<div className="mb-6 hidden text-center md:mb-10 md:block">/)
  assert.match(source, /Online-Anfrage · ca\. 2 Minuten/)
  assert.match(source, /Beantworten Sie ein paar kurze Fragen\. Wir melden uns mit Verfügbarkeit und Angebot\./)
  assert.doesNotMatch(source, /<div className="mb-6 text-center md:mb-10">/)
})

test("choice and summary rows can shrink inside mobile cards", () => {
  assert.match(source, /min-h-\[120px\][^"]*w-full min-w-0/)
  assert.match(source, /<div className="min-w-0">/)
  assert.match(source, /break-words/)
  assert.match(source, /flex flex-col gap-2 rounded-2xl bg-zinc-50 p-3 sm:flex-row/)
})


test("inquiry-only summary does not render zero-euro price", () => {
  assert.equal(source.includes('selectedWaste ? ` (${formatEuro(selectedWaste.netPrice)}'), false)
  assert.match(source, /selectedWaste && selectedWaste\.paymentMode !== "inquiry_only"/)
})
