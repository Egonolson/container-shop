"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Container, Check, ArrowRight } from "lucide-react"
import { formatPrice, getMinPrice } from "./catalog-types"

interface ProductCardProps {
  product: any
  onAddToCart: (product: any, variant: any) => void
  addedVariant: string | null
  /** Basis-Pfad für Produkt-Links — "" für normalen Shop, "/embed" im iframe */
  basePath?: string
}

// Farbe je nach Container-Kategorie
function getCategoryAccent(title: string): string {
  if (title.toLowerCase().includes("abroll")) return "bg-seyfarth-blue"
  if (title.toLowerCase().includes("spezial") || title.toLowerCase().includes("asbest") || title.toLowerCase().includes("kmf") || title.toLowerCase().includes("dachpappe")) return "bg-red-500"
  return "bg-seyfarth-orange"
}

function getOptionValue(variant: any, optionTitle: string): string | undefined {
  return variant.options?.find((o: any) => o.option?.title === optionTitle)?.value
}

export function ProductCard({ product, onAddToCart, addedVariant, basePath = "" }: ProductCardProps) {
  const minPrice = getMinPrice(product)
  const accentColor = getCategoryAccent(product.title)

  // Detect multi-option product (e.g. Größe + Abfallart)
  const firstOptionTitle: string = product.options?.[0]?.title ?? ""
  const secondOptionTitle: string | undefined = product.options?.[1]?.title
  const isMultiOption = !!secondOptionTitle

  const [selectedFirstOption, setSelectedFirstOption] = useState<string | null>(null)

  // Unique values for first option (in insertion order from variants)
  const firstOptionValues = useMemo<string[]>(() => {
    if (!isMultiOption) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const v of product.variants || []) {
      const val = getOptionValue(v, firstOptionTitle)
      if (val && !seen.has(val)) {
        seen.add(val)
        result.push(val)
      }
    }
    return result
  }, [product.variants, firstOptionTitle, isMultiOption])

  // Variants available for the selected first option value
  const filteredVariants = useMemo(() => {
    if (!isMultiOption || !selectedFirstOption) return []
    return (product.variants || []).filter((v: any) =>
      getOptionValue(v, firstOptionTitle) === selectedFirstOption
    )
  }, [product.variants, firstOptionTitle, selectedFirstOption, isMultiOption])

  return (
    <div className="bg-white rounded-[24px] overflow-hidden border border-zinc-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Top accent stripe */}
      <div className={`h-1.5 ${accentColor}`} />

      <div className="p-7 flex-1 flex flex-col">
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-seyfarth-yellow/35 shrink-0 mt-0.5">
            <Container className="h-6 w-6 text-seyfarth-navy" strokeWidth={1.5} />
          </div>
          <div>
            <Link href={`${basePath}/p/${product.handle}`}>
              <h3 className="text-lg font-bold text-seyfarth-navy hover:text-seyfarth-blue transition-colors leading-tight">
                {product.title}
              </h3>
            </Link>
            {product.description && (
              <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{product.description}</p>
            )}
          </div>
        </div>

        {/* Price badge */}
        {minPrice !== null && (
          <div className="mb-5">
            <span className="inline-block bg-seyfarth-blue/10 text-seyfarth-blue px-3 py-1.5 rounded-lg text-sm font-bold">
              ab {formatPrice(minPrice)}
            </span>
          </div>
        )}

        {/* Variants — 2-step selector for multi-option, flat grid for single-option */}
        {product.variants && product.variants.length > 0 && (
          <div className="mt-auto">
            {isMultiOption ? (
              <>
                {/* Step 1: first option (Größe) */}
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3 font-medium">
                  {firstOptionTitle} wählen
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {firstOptionValues.map((val) => (
                    <button
                      key={val}
                      onClick={() => setSelectedFirstOption(val === selectedFirstOption ? null : val)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        selectedFirstOption === val
                          ? "border-seyfarth-blue bg-seyfarth-blue text-white shadow-sm"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                {/* Step 2: second option (Abfallart) after size selection */}
                {selectedFirstOption && (
                  <>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3 font-medium">
                      {secondOptionTitle} wählen
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {filteredVariants.map((variant: any) => {
                        const price = variant.calculated_price?.calculated_amount
                          ?? variant.prices?.[0]?.amount
                          ?? 0
                        const abfallart = getOptionValue(variant, secondOptionTitle!) ?? variant.title
                        const isAdded = addedVariant === variant.id
                        return (
                          <button
                            key={variant.id}
                            onClick={() => onAddToCart(product, variant)}
                            className={`text-left border rounded-xl p-3.5 transition-all duration-200 group ${
                              isAdded
                                ? "bg-green-50 border-green-400"
                                : "border-zinc-200 hover:border-seyfarth-blue hover:bg-seyfarth-blue/5"
                            }`}
                          >
                            <p className={`font-medium text-xs leading-tight ${isAdded ? "text-green-700" : "text-zinc-800"}`}>
                              {abfallart}
                            </p>
                            <p className={`text-xs mt-1 ${isAdded ? "text-green-600" : "text-zinc-500"}`}>
                              {formatPrice(price)}
                            </p>
                            {isAdded ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 mt-1.5 font-medium">
                                <Check className="h-3 w-3" /> Hinzugefügt
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-seyfarth-blue mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                                Auswählen <ArrowRight className="h-3 w-3" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Single-option: flat grid (previous behaviour) */}
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-3 font-medium">
                  {firstOptionTitle || "Abfallart"} wählen
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {product.variants.map((variant: any) => {
                    const price = variant.calculated_price?.calculated_amount
                      ?? variant.prices?.[0]?.amount
                      ?? 0
                    const isAdded = addedVariant === variant.id
                    return (
                      <button
                        key={variant.id}
                        onClick={() => onAddToCart(product, variant)}
                        className={`text-left border rounded-xl p-3.5 transition-all duration-200 group ${
                          isAdded
                            ? "bg-green-50 border-green-400"
                            : "border-zinc-200 hover:border-seyfarth-blue hover:bg-seyfarth-blue/5"
                        }`}
                      >
                        <p className={`font-medium text-xs leading-tight ${isAdded ? "text-green-700" : "text-zinc-800"}`}>
                          {variant.title || "Standard"}
                        </p>
                        <p className={`text-xs mt-1 ${isAdded ? "text-green-600" : "text-zinc-500"}`}>
                          {formatPrice(price)}
                        </p>
                        {isAdded ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 mt-1.5 font-medium">
                            <Check className="h-3 w-3" /> Hinzugefügt
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-seyfarth-blue mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                            Auswählen <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
