// Shared types, constants, and filter logic for the product catalog

export type CategoryKey = "bigbag" | "absetzcontainer" | "abrollcontainer" | "spezialcontainer" | "recyclinghof"

export interface CategoryConfig {
  key: CategoryKey
  label: string
  handlePrefix: string | null
  icon: string // Lucide icon name
}

export const CATEGORY_CONFIG: CategoryConfig[] = [
  { key: "bigbag",          label: "BigBag & Multicar",        handlePrefix: "bigbag",          icon: "ShoppingBag" },
  { key: "absetzcontainer", label: "Absetzcontainer",           handlePrefix: "absetzcontainer", icon: "Package" },
  { key: "abrollcontainer", label: "Abrollcontainer",           handlePrefix: "abrollcontainer", icon: "Truck" },
  { key: "spezialcontainer",label: "Spezialcontainer",          handlePrefix: null,              icon: "ShieldAlert" },
  { key: "recyclinghof",    label: "Recyclinghof",              handlePrefix: "recycling",       icon: "Recycle" },
]

// Gesetzliche Gefahrstoff-Klassifizierung (GewAbfV) — bewusst hardcoded
export const HAZARDOUS_WASTE_TYPES = new Set([
  "Asbest", "KMF", "Kontaminierter Boden",
  "Dachpappe teerhaltig", "HBCD-haltig",
])

/**
 * Derive category from product handle prefix.
 * "bigbag-1m3"           → "bigbag"
 * "absetzcontainer-7m3"  → "absetzcontainer"
 * "abrollcontainer-10m3" → "abrollcontainer"
 * "recycling-*"          → "recyclinghof"
 * Anything else          → "spezialcontainer"
 */
export function deriveCategory(handle: string): CategoryKey {
  for (const cat of CATEGORY_CONFIG) {
    if (cat.handlePrefix && handle.startsWith(cat.handlePrefix)) {
      return cat.key
    }
  }
  return "spezialcontainer"
}

/**
 * Extract the "Abfallart" value from a variant.
 * Multi-option products (Medusa v2 API): variant.options = [{ option: { title: "..." }, value: "..." }]
 * Single-option products: fall back to variant.title.
 */
export function getVariantAbfallart(variant: any): string | null {
  const opt = variant.options?.find((o: any) => o.option?.title === "Abfallart")
  if (opt) return opt.value
  return variant.title ?? null
}

/**
 * Extract unique waste types from all variant options across products.
 * For multi-option products the "Abfallart" option value is used;
 * for single-option products the variant title is used as fallback.
 * Sorted: normal types first (alphabetical), then hazardous (alphabetical).
 */
export function extractWasteTypes(products: any[]): string[] {
  const types = new Set<string>()
  for (const product of products) {
    for (const variant of product.variants || []) {
      const abfallart = getVariantAbfallart(variant)
      if (abfallart && abfallart !== "Standard") {
        types.add(abfallart)
      }
    }
  }

  const normal: string[] = []
  const hazardous: string[] = []
  for (const t of types) {
    if (HAZARDOUS_WASTE_TYPES.has(t)) {
      hazardous.push(t)
    } else {
      normal.push(t)
    }
  }

  return [...normal.sort(), ...hazardous.sort()]
}

/**
 * Filter products by active category and selected waste types.
 * Supports both multi-option (Abfallart in variant.options) and single-option products.
 */
export function filterProducts(
  products: any[],
  activeCategory: CategoryKey | null,
  activeWasteTypes: Set<string>,
): any[] {
  return products.filter((product) => {
    if (activeCategory) {
      const productCategory = deriveCategory(product.handle || "")
      if (productCategory !== activeCategory) return false
    }
    if (activeWasteTypes.size > 0) {
      const hasMatch = (product.variants || []).some((v: any) => {
        const abfallart = getVariantAbfallart(v)
        return abfallart !== null && activeWasteTypes.has(abfallart)
      })
      if (!hasMatch) return false
    }
    return true
  })
}

export function formatPrice(cents: number) {
  if (cents === 0) return "Auf Anfrage"
  // de-DE gibt "349,00\u00a0€" (Non-Breaking-Space) — normalisieren zu regulärem Leerzeichen
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100).replace(/\u00a0/, " ")
}

export function getMinPrice(product: any): number | null {
  let min = Infinity
  for (const v of product.variants || []) {
    const p = v.calculated_price?.calculated_amount ?? v.prices?.[0]?.amount ?? Infinity
    if (p < min) min = p
  }
  return min === Infinity ? null : min
}
