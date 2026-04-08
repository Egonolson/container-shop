"use client"

import { useState, useMemo } from "react"
import {
  Loader2, SearchX,
  LayoutGrid,
  ShoppingBag, Package, Truck, ShieldAlert, Recycle,
} from "lucide-react"
import { CategoryKey, CATEGORY_CONFIG, filterProducts } from "./catalog-types"
import { ProductCard } from "./product-card"

// Icon-Map: string name → Lucide-Komponente
const ICON_MAP: Record<string, React.ElementType> = {
  ShoppingBag,
  Package,
  Truck,
  ShieldAlert,
  Recycle,
}

interface ProductCatalogSectionProps {
  products: any[]
  loading: boolean
  onAddToCart: (product: any, variant: any) => void
  addedVariant: string | null
  defaultCategory?: CategoryKey | null
  compact?: boolean
  /** Basis-Pfad für interne Links — "/embed" im iframe-Modus */
  basePath?: string
}

export function ProductCatalogSection({
  products,
  loading,
  onAddToCart,
  addedVariant,
  defaultCategory = null,
  compact = false,
  basePath = "",
}: ProductCatalogSectionProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(defaultCategory)

  const filteredProducts = useMemo(
    () => filterProducts(products, activeCategory, new Set()),
    [products, activeCategory],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const cat of CATEGORY_CONFIG) {
      c[cat.key] = filterProducts(products, cat.key, new Set()).length
    }
    return c
  }, [products])

  if (loading) {
    return (
      <section id="katalog" className={compact ? "py-8" : "py-24"}>
        <div className="max-w-7xl mx-auto px-6 flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-seyfarth-blue" />
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return (
      <section id="katalog" className={compact ? "py-8" : "py-24"}>
        <div className="max-w-7xl mx-auto px-6 text-center py-16">
          <p className="text-zinc-400">Keine Produkte verfügbar.</p>
        </div>
      </section>
    )
  }

  return (
    <section id="katalog" className={compact ? "py-8 bg-zinc-50/50" : "py-24 bg-zinc-50/50"}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        {!compact && (
          <div className="text-center mb-10">
            <h2 className="font-headline text-3xl md:text-4xl text-seyfarth-navy italic">Unsere Container</h2>
            <p className="mt-3 text-zinc-500">Wählen Sie die passende Kategorie für Ihr Projekt</p>
          </div>
        )}

        {/* Kategorie-Kacheln */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">

          {/* Alle */}
          <button
            onClick={() => setActiveCategory(null)}
            className={`flex flex-col items-center gap-2.5 px-3 py-5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 group ${
              activeCategory === null
                ? "border-seyfarth-navy bg-seyfarth-navy text-white shadow-lg scale-[1.02]"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-seyfarth-navy/50 hover:text-seyfarth-navy hover:shadow-md"
            }`}
          >
            <LayoutGrid
              className={`h-6 w-6 transition-colors ${
                activeCategory === null ? "text-seyfarth-yellow" : "text-zinc-400 group-hover:text-seyfarth-navy"
              }`}
              strokeWidth={1.5}
            />
            <span>Alle</span>
            <span className={`text-xs font-normal ${activeCategory === null ? "text-blue-200" : "text-zinc-400"}`}>
              {products.length} Produkte
            </span>
          </button>

          {/* Kategorien */}
          {CATEGORY_CONFIG.map((cat) => {
            const Icon = ICON_MAP[cat.icon] ?? Package
            const isActive = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(isActive ? null : cat.key)}
                className={`flex flex-col items-center gap-2.5 px-3 py-5 rounded-2xl border-2 text-sm font-semibold transition-all duration-200 group ${
                  isActive
                    ? "border-seyfarth-navy bg-seyfarth-navy text-white shadow-lg scale-[1.02]"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-seyfarth-navy/50 hover:text-seyfarth-navy hover:shadow-md"
                }`}
              >
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isActive ? "text-seyfarth-yellow" : "text-zinc-400 group-hover:text-seyfarth-navy"
                  }`}
                  strokeWidth={1.5}
                />
                <span className="text-center leading-tight">{cat.label}</span>
                <span className={`text-xs font-normal ${isActive ? "text-blue-200" : "text-zinc-400"}`}>
                  {counts[cat.key] || 0} Produkte
                </span>
              </button>
            )
          })}
        </div>

        {/* Aktive Kategorie — Zähler + Reset */}
        {activeCategory && (
          <div className="flex items-center justify-between mb-6 px-1">
            <p className="text-sm text-zinc-500">
              <span className="font-semibold text-seyfarth-navy">{filteredProducts.length} Container</span>
              {" "}in dieser Kategorie
            </p>
            <button
              onClick={() => setActiveCategory(null)}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors underline underline-offset-2"
            >
              Alle anzeigen
            </button>
          </div>
        )}

        {/* Produkt-Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                addedVariant={addedVariant}
                basePath={basePath}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <SearchX className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg mb-4">Keine Container in dieser Kategorie</p>
            <button
              onClick={() => setActiveCategory(null)}
              className="px-6 py-2 rounded-full text-sm font-medium bg-seyfarth-navy text-white hover:bg-seyfarth-blue transition-all"
            >
              Alle anzeigen
            </button>
          </div>
        )}

        {/* Embed: kleiner dezenter Shop-Link ganz unten */}
        {compact && (
          <div className="mt-8 pt-4 border-t border-zinc-100 text-center">
            <a
              href="https://seyfarth.visionmakegpt.work"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-400 hover:text-seyfarth-navy transition-colors"
            >
              containerdienst-seyfarth.de — Online-Bestellportal
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
