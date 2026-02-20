"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Box,
  ShoppingCart,
  Check,
  AlertTriangle,
  ShieldCheck,
  Recycle,
  Truck,
  ChevronRight,
  ArrowLeft,
  Package,
  CalendarCheck,
  ClipboardCheck,
} from "lucide-react"
import { useCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import { PublicShell } from "@/components/public/public-shell"
import {
  formatPrice,
  getMinPrice,
  deriveCategory,
  CATEGORY_CONFIG,
  HAZARDOUS_WASTE_TYPES,
} from "@/components/public/catalog/catalog-types"
import { VariantSelector } from "./variant-selector"

interface ProductLandingContentProps {
  product: any
}

const steps = [
  { icon: Package, title: "Wählen", text: "Container & Abfallart" },
  { icon: CalendarCheck, title: "Termin", text: "Wunschtermin angeben" },
  { icon: Truck, title: "Befüllen", text: "Wir liefern, Sie befüllen" },
  { icon: ClipboardCheck, title: "Entsorgen", text: "Fachgerecht & sicher" },
]

export function ProductLandingContent({ product }: ProductLandingContentProps) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants?.[0] ?? null
  )
  const [added, setAdded] = useState(false)

  const category = deriveCategory(product.handle || "")
  const categoryConfig = CATEGORY_CONFIG.find((c) => c.key === category)
  const minPrice = getMinPrice(product)

  const hasHazardousVariants = (product.variants || []).some((v: any) =>
    HAZARDOUS_WASTE_TYPES.has(v.title)
  )

  const selectedPrice = selectedVariant
    ? (selectedVariant.calculated_price?.calculated_amount ??
       selectedVariant.prices?.[0]?.amount ??
       0)
    : 0

  const selectedIsHazardous = selectedVariant
    ? HAZARDOUS_WASTE_TYPES.has(selectedVariant.title)
    : false

  function handleAddToCart() {
    if (!selectedVariant) return
    addItem({
      productId: product.id,
      productTitle: product.title,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title || "Standard",
      price: selectedPrice,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-28 md:pb-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-zinc-400 mb-8">
          <Link href="/#katalog" className="hover:text-seyfarth-blue transition-colors">
            Katalog
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {categoryConfig && (
            <>
              <span>{categoryConfig.label}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="text-zinc-700 font-medium">{product.title}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center">
            <Box className="h-8 w-8 text-zinc-300" strokeWidth={1} />
          </div>
          <div>
            {categoryConfig && (
              <p className="text-sm text-zinc-400 font-medium">{categoryConfig.label}</p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-seyfarth-navy">
              {product.title}
            </h1>
            {minPrice !== null && (
              <p className="text-lg font-semibold text-seyfarth-blue mt-1">
                Ab {formatPrice(minPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-zinc-600 leading-relaxed mb-8">{product.description}</p>
        )}

        {/* Hazardous warning */}
        {hasHazardousVariants && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-8">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Gefährlicher Abfall</p>
              <p className="text-sm text-red-600 mt-1">
                Einige Abfallarten sind als gefährlich klassifiziert. Es gelten besondere Entsorgungsvorschriften nach GewAbfV.
              </p>
            </div>
          </div>
        )}

        {/* Variant Selector */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-4">
              Abfallart wählen
            </h2>
            <VariantSelector
              variants={product.variants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={setSelectedVariant}
            />
          </div>
        )}

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center justify-between p-5 rounded-2xl bg-zinc-50 border border-zinc-200 mb-10">
          <div>
            <span className="text-2xl font-bold text-seyfarth-navy">
              {formatPrice(selectedPrice)}
            </span>
            {selectedVariant && (
              <span className="text-sm text-zinc-400 ml-2">
                {selectedVariant.title || "Standard"}
              </span>
            )}
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className={`rounded-full px-8 py-6 text-base font-semibold transition-all ${
              added
                ? "bg-green-600 hover:bg-green-700 text-white"
                : selectedIsHazardous
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-seyfarth-orange hover:bg-seyfarth-yellow hover:text-seyfarth-navy text-white"
            }`}
          >
            {added ? (
              <><Check className="h-5 w-5" /> Hinzugefügt</>
            ) : (
              <><ShoppingCart className="h-5 w-5" /> In den Warenkorb</>
            )}
          </Button>
        </div>

        {/* So funktioniert's (compact) */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-4">
            So funktioniert&apos;s
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="relative inline-block mb-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-seyfarth-blue/10">
                    <step.icon className="h-5 w-5 text-seyfarth-blue" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-seyfarth-orange text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <p className="text-xs font-medium text-zinc-700">{step.title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 hidden sm:block">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust-Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: ShieldCheck, text: "Entsorgungsfachbetrieb" },
            { icon: Recycle, text: "Fachgerechte Entsorgung" },
            { icon: Truck, text: "Lieferung zum Wunschtermin" },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100"
            >
              <item.icon className="h-5 w-5 text-seyfarth-blue flex-shrink-0" strokeWidth={1.5} />
              <span className="text-sm text-zinc-700">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Back to catalog */}
        <Link
          href="/#katalog"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-seyfarth-blue transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Alle Container ansehen
        </Link>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur border-t border-zinc-200 p-4 z-50">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div>
            <span className="text-xl font-bold text-seyfarth-navy">
              {formatPrice(selectedPrice)}
            </span>
            {selectedVariant && (
              <span className="text-xs text-zinc-400 block">
                {selectedVariant.title || "Standard"}
              </span>
            )}
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={!selectedVariant}
            className={`rounded-full px-6 py-5 text-sm font-semibold transition-all ${
              added
                ? "bg-green-600 hover:bg-green-700 text-white"
                : selectedIsHazardous
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-seyfarth-orange hover:bg-seyfarth-yellow hover:text-seyfarth-navy text-white"
            }`}
          >
            {added ? (
              <><Check className="h-4 w-4" /> Hinzugefügt</>
            ) : (
              <><ShoppingCart className="h-4 w-4" /> In den Warenkorb</>
            )}
          </Button>
        </div>
      </div>
    </PublicShell>
  )
}
