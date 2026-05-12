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
]

export const materialItems: MaterialItem[] = [
  { id: "kulturboden", name: "Kulturboden", category: "Erden", specification: "0/15 gesiebt", unit: "t", netPrice: 15.9, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "rindenmulch", name: "Rindenmulch", category: "Erden", specification: "geschreddert", unit: "m³", netPrice: 44, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "betonrecycling", name: "Betonrecycling", category: "Recyclingmaterial", specification: "0/45 gebrochen", unit: "t", netPrice: 8, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
  { id: "frostschutzkies", name: "Frostschutzkies", category: "Kiese", specification: "0/32 mit Zertifikat", unit: "t", netPrice: 19.5, fixedPrice: true, paymentModes: ["inquiry", "invoice", "onsite"] },
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
