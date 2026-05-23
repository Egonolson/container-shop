export type ShopMode = "entsorgung" | "baustoffe" | "transport"
export type PlacementType = "private" | "public" | "unknown"
export type OrderIntent = "inquiry" | "order"

export interface WasteItem {
  id: string
  name: string
  category: string
  avv: string
  unit: "t" | "m³" | "Stück"
  netPrice: number
  requiresWeighing: boolean
  isHazardous?: boolean
  packaging?: string
  notice?: string
  allowedContainerSizes: string[]
  paymentMode: "pay_on_site_after_weighing" | "inquiry_only"
}

export interface MaterialItem {
  id: string
  name: string
  category: string
  specification: string
  unit: "t" | "m³"
  netPrice: number
  fixedPrice: boolean
  paymentModes: Array<"inquiry" | "invoice" | "onsite" | "online_fixed_price">
}

export interface ZoneLocation {
  postalCode: string
  city: string
  zone: 1 | 2 | 3
}

export const REQUEST_FORM_VERSION = "seyfarth-inquiry-v1"

export const containerSizes = ["3 m³", "5 m³", "7 m³", "10 m³", "12 m³", "15 m³", "20 m³", "30 m³", "40 m³", "Ich bin unsicher"]

export const transportPrices = {
  1: { multicar: 89, absetzer: 104, abrollSmall: 104, abrollMedium: 135, abrollLarge: 135, bulkMulticar: 60, bulkAbsetzer: 75, bulkAbroller: 80 },
  2: { multicar: 95, absetzer: 115, abrollSmall: 115, abrollMedium: 145, abrollLarge: 145, bulkMulticar: 65, bulkAbsetzer: 80, bulkAbroller: 85 },
  3: { multicar: 99, absetzer: 125, abrollSmall: 125, abrollMedium: 158, abrollLarge: 158, bulkMulticar: 75, bulkAbsetzer: 85, bulkAbroller: 90 },
} as const

export const zoneLocations: ZoneLocation[] = [
  { postalCode: "04639", city: "Ponitz", zone: 1 },
  { postalCode: "04600", city: "Altenburg", zone: 1 },
  { postalCode: "08393", city: "Meerane", zone: 1 },
  { postalCode: "08451", city: "Crimmitschau", zone: 1 },
  { postalCode: "07545", city: "Gera", zone: 2 },
  { postalCode: "07546", city: "Gera", zone: 2 },
  { postalCode: "07548", city: "Gera", zone: 2 },
  { postalCode: "08056", city: "Zwickau", zone: 2 },
  { postalCode: "08058", city: "Zwickau", zone: 2 },
  { postalCode: "09111", city: "Chemnitz", zone: 3 },
  { postalCode: "04275", city: "Leipzig", zone: 3 },
]

export const wasteItems: WasteItem[] = [
  { id: "bauschutt-rein", name: "Bauschutt rein", category: "Bauschutt", avv: "170107", unit: "t", netPrice: 23.5, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "bauschutt-gemischt", name: "Bauschutt gemischt", category: "Bauschutt", avv: "170107", unit: "t", netPrice: 48, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "erdaushub-lehm", name: "Erdaushub / Lehm", category: "Boden / Erde", avv: "170504", unit: "t", netPrice: 19.5, requiresWeighing: true, allowedContainerSizes: ["3 m³", "5 m³", "7 m³", "Ich bin unsicher"], paymentMode: "pay_on_site_after_weighing" },
  { id: "mutterboden-verwertung", name: "Mutterboden zur Verwertung", category: "Boden / Erde", avv: "170504", unit: "t", netPrice: 19.5, requiresWeighing: true, allowedContainerSizes: ["3 m³", "5 m³", "7 m³", "Ich bin unsicher"], paymentMode: "pay_on_site_after_weighing" },
  { id: "bauschutt-erde-gemisch", name: "Bauschutt-Erde-Gemisch", category: "Bauschutt", avv: "170107", unit: "t", netPrice: 48, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "bauschutt-verunreinigt-10", name: "Bauschutt verunreinigt (bis 10%)", category: "Prüfpflichtige Abfälle", avv: "170107", unit: "t", netPrice: 0, requiresWeighing: true, notice: "Zusammensetzung und Annahme werden vor Bestätigung persönlich geprüft.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "bauschutt-verunreinigt-25", name: "Bauschutt verunreinigt (bis 25%)", category: "Prüfpflichtige Abfälle", avv: "170107", unit: "t", netPrice: 0, requiresWeighing: true, notice: "Zusammensetzung und Annahme werden vor Bestätigung persönlich geprüft.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "bauschutt-stark-verunreinigt-50", name: "Bauschutt stark verunreinigt (bis 50%)", category: "Prüfpflichtige Abfälle", avv: "170107", unit: "t", netPrice: 0, requiresWeighing: true, notice: "Zusammensetzung und Annahme werden vor Bestätigung persönlich geprüft.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "bauschutt-stark-verunreinigt-50-polterabend", name: "Bauschutt stark verunreinigt (bis 50%) (Polterabend)", category: "Prüfpflichtige Abfälle", avv: "170107", unit: "t", netPrice: 0, requiresWeighing: true, notice: "Zusammensetzung und Annahme werden vor Bestätigung persönlich geprüft.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "beton-groesser-80-armierung", name: "Beton größer 80 cm mit Armierung", category: "Bauschutt", avv: "170101", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "asphalt-strassenaufbruch", name: "Asphalt / Straßenaufbruch", category: "Bauschutt", avv: "170302", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "bauschutt-schwarz-bitumen", name: "Bauschutt mit Schwarz- / Bitumenanstrich / Anhaftungen", category: "Prüfpflichtige Abfälle", avv: "170107", unit: "t", netPrice: 0, requiresWeighing: true, notice: "Bitumen- und Anhaftungen müssen vor Annahme geprüft werden.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "schlacke-schuettung", name: "Schlacke / Schüttung", category: "Prüfpflichtige Abfälle", avv: "170904", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "schornstein-essen-schutt", name: "Schornstein-, Essen-Schutt", category: "Prüfpflichtige Abfälle", avv: "170904", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "steinholzfussboden-estrich", name: "Steinholzfußboden / -estrich", category: "Prüfpflichtige Abfälle", avv: "170904", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "wurzelstubben", name: "Wurzelstubben", category: "Grünabfall", avv: "200201", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "hwl-sauerkrautplatten", name: "HWL-Platten / Sauerkrautplatten", category: "Ausbau", avv: "170904", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "mineralwolle-nicht-gefaehrlich-gelb", name: "Mineralwolle / Dämmwolle nicht gefährlich (gelb)", category: "Dämmstoffe", avv: "170604", unit: "t", netPrice: 0, requiresWeighing: true, packaging: "staubdicht verpackt", allowedContainerSizes: ["3 m³", "5 m³", "Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "friedhofsabfaelle", name: "Friedhofsabfälle", category: "Mischabfälle", avv: "200203", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "siedlungs-gewerbeabfaelle", name: "Siedlungsabfälle / Gewerbeabfälle", category: "Mischabfälle", avv: "200301", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "pappe-papier", name: "Pappe und Papier", category: "Wertstoffe", avv: "200101", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "flachglas-fensterglas-sauber", name: "Flachglas / Fensterglas (sauber)", category: "Glas", avv: "170202", unit: "t", netPrice: 0, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "dachpappe-bitumenhaltig", name: "Dachpappe bitumenhaltig", category: "Prüfpflichtige Abfälle", avv: "170302", unit: "t", netPrice: 0, requiresWeighing: true, packaging: "staubdicht verpackt", allowedContainerSizes: ["3 m³", "5 m³", "7 m³", "Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "baumischabfall", name: "Baumischabfall", category: "Mischabfälle", avv: "170904", unit: "t", netPrice: 196, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "sperrmuell", name: "Sperrmüll", category: "Mischabfälle", avv: "200307", unit: "t", netPrice: 266.5, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "holz-a1-a3", name: "Altholz A I–A III", category: "Holz", avv: "170201", unit: "t", netPrice: 118, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "holz-a4", name: "Altholz A IV", category: "Holz", avv: "170204*", unit: "t", netPrice: 185, requiresWeighing: true, isHazardous: true, notice: "Behandeltes Holz kann gefährliche Bestandteile enthalten. Annahme nur nach Prüfung.", allowedContainerSizes: containerSizes, paymentMode: "inquiry_only" },
  { id: "gruenschnitt", name: "Grünschnitt", category: "Grünabfall", avv: "200201", unit: "t", netPrice: 62, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "erdaushub", name: "Erdaushub unbelastet", category: "Boden / Erde", avv: "170504", unit: "t", netPrice: 19.5, requiresWeighing: true, allowedContainerSizes: ["3 m³", "5 m³", "7 m³", "Ich bin unsicher"], paymentMode: "pay_on_site_after_weighing" },
  { id: "gipskarton", name: "Gipskarton / Rigips", category: "Ausbau", avv: "170802", unit: "t", netPrice: 125, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "gasbeton", name: "Gasbeton / Porenbeton", category: "Bauschutt", avv: "170101", unit: "t", netPrice: 95, requiresWeighing: true, allowedContainerSizes: containerSizes, paymentMode: "pay_on_site_after_weighing" },
  { id: "dachpappe-teerhaltig", name: "Dachpappe teerhaltig", category: "Gefährliche Abfälle", avv: "170303*", unit: "t", netPrice: 420, requiresWeighing: true, isHazardous: true, packaging: "staubdicht verpackt", notice: "Teerhaltige Dachpappe ist ein gefährlicher Abfall und wird nur nach vorheriger Prüfung angenommen.", allowedContainerSizes: ["3 m³", "5 m³", "7 m³", "Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "mineralwolle", name: "Mineralwolle / KMF", category: "Gefährliche Abfälle", avv: "170603*", unit: "t", netPrice: 790, requiresWeighing: true, isHazardous: true, packaging: "KMF-Säcke / Big Bags", notice: "Mineralwolle muss ordnungsgemäß staubdicht verpackt sein. Anfrage wird vor Bestätigung geprüft.", allowedContainerSizes: ["3 m³", "5 m³", "Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "asbest", name: "Asbest / asbesthaltige Baustoffe", category: "Gefährliche Abfälle", avv: "170605*", unit: "t", netPrice: 280, requiresWeighing: true, isHazardous: true, packaging: "Platten-Big-Bag / Big Bag", notice: "Asbest darf nur fachgerecht verpackt und nach vorheriger Abstimmung entsorgt werden.", allowedContainerSizes: ["3 m³", "5 m³", "Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "platten-big-bag-asbest", name: "Platten-Big-Bag (für Asbest)", category: "Verpackung", avv: "170605*", unit: "Stück", netPrice: 0, requiresWeighing: false, isHazardous: true, packaging: "Platten-Big-Bag", notice: "Nur in Abstimmung für fachgerecht verpackte Asbestplatten.", allowedContainerSizes: ["Ich bin unsicher"], paymentMode: "inquiry_only" },
  { id: "sack-big-bag-baustellenabfaelle-asbest", name: "Sack-Big-Bag (für Baustellenabfälle und Asbest)", category: "Verpackung", avv: "170605*", unit: "Stück", netPrice: 0, requiresWeighing: false, isHazardous: true, packaging: "Sack-Big-Bag", notice: "Nur nach persönlicher Prüfung und Abstimmung.", allowedContainerSizes: ["Ich bin unsicher"], paymentMode: "inquiry_only" },
]

export const materialItems: MaterialItem[] = [
  { id: "humus", name: "Humus", category: "Erden", specification: "gesiebt", unit: "t", netPrice: 26, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "pflanzerde", name: "Pflanzerde", category: "Erden", specification: "gesiebt", unit: "t", netPrice: 26, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "kulturboden", name: "Kulturboden", category: "Erden", specification: "0/15 gesiebt", unit: "t", netPrice: 15.9, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "rindenmulch", name: "Rindenmulch", category: "Erden", specification: "geschreddert", unit: "m³", netPrice: 44, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "ziegelrecycling", name: "Ziegelrecycling", category: "Recyclingmaterial", specification: "gebrochen", unit: "t", netPrice: 1, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "asphaltrecycling", name: "Asphaltrecycling", category: "Recyclingmaterial", specification: "gebrochen", unit: "t", netPrice: 4, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "betonrecycling", name: "Betonrecycling", category: "Recyclingmaterial", specification: "0/45 gebrochen", unit: "t", netPrice: 8, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "frostschutzkies", name: "Frostschutzkies", category: "Kiese", specification: "0/32 mit Zertifikat", unit: "t", netPrice: 19.5, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "splitt-diabas-wegebau", name: "Splitt Diabas (Wegebau)", category: "Splitt und Steine", specification: "Diabas", unit: "t", netPrice: 38, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "mineralstoffgemisch", name: "Mineralstoffgemisch", category: "Recyclingmaterial", specification: "0/32", unit: "t", netPrice: 19.5, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "splitt", name: "Splitt", category: "Splitt und Steine", specification: "verschiedene Körnungen", unit: "t", netPrice: 28, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "sand", name: "Sand", category: "Sande", specification: "gewaschen", unit: "t", netPrice: 18, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
]

export function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

export function getCityForPostalCode(postalCode: string) {
  const normalizedPostalCode = postalCode.trim()
  if (normalizedPostalCode.length !== 5) return null

  const cities = Array.from(
    new Set(zoneLocations.filter((entry) => entry.postalCode === normalizedPostalCode).map((entry) => entry.city)),
  )

  return cities.length === 1 ? cities[0] : null
}

export function lookupZone(postalCode: string, city?: string) {
  const normalizedCity = city?.trim().toLowerCase()
  return zoneLocations.find((entry) =>
    entry.postalCode === postalCode.trim() && (!normalizedCity || entry.city.toLowerCase().includes(normalizedCity))
  ) ?? zoneLocations.find((entry) => entry.postalCode === postalCode.trim())
}

export function getTransportPrice(zone: 1 | 2 | 3 | undefined, mode: ShopMode, containerSize?: string) {
  if (!zone) return null
  const prices = transportPrices[zone]
  if (mode === "baustoffe") return prices.bulkAbsetzer
  if (containerSize?.includes("15") || containerSize?.includes("20") || containerSize?.includes("30") || containerSize?.includes("40")) return prices.abrollLarge
  if (containerSize?.includes("10") || containerSize?.includes("12")) return prices.abrollMedium
  return prices.absetzer
}
