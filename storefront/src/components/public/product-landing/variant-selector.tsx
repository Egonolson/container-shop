"use client"

import { useState, useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { HAZARDOUS_WASTE_TYPES, formatPrice } from "../catalog/catalog-types"

interface VariantSelectorProps {
  variants: any[]
  selectedId: string | null
  onSelect: (variant: any) => void
}

function getOptionValue(variant: any, optionTitle: string): string | undefined {
  return variant.options?.find((o: any) => o.option?.title === optionTitle)?.value
}

function getAbfallart(variant: any): string {
  // Multi-option: look for "Abfallart" in options array
  const opt = variant.options?.find((o: any) => o.option?.title === "Abfallart")
  if (opt) return opt.value
  // Single-option fallback
  return variant.title ?? ""
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  // Detect multi-option product from first variant
  const firstOptionTitle: string = variants[0]?.options?.[0]?.option?.title ?? ""
  const secondOptionTitle: string | undefined = variants[0]?.options?.[1]?.option?.title
  const isMultiOption = !!secondOptionTitle

  // Pre-populate size from currently selected variant
  const [selectedFirstOption, setSelectedFirstOption] = useState<string | null>(() => {
    if (!selectedId || !isMultiOption) return null
    const selected = variants.find((v) => v.id === selectedId)
    return selected ? (getOptionValue(selected, firstOptionTitle) ?? null) : null
  })

  // Unique first-option values in insertion order
  const firstOptionValues = useMemo<string[]>(() => {
    if (!isMultiOption) return []
    const seen = new Set<string>()
    const result: string[] = []
    for (const v of variants) {
      const val = getOptionValue(v, firstOptionTitle)
      if (val && !seen.has(val)) {
        seen.add(val)
        result.push(val)
      }
    }
    return result
  }, [variants, firstOptionTitle, isMultiOption])

  // Variants matching the selected first-option value
  const filteredVariants = useMemo(() => {
    if (!isMultiOption || !selectedFirstOption) return []
    return variants.filter((v) => getOptionValue(v, firstOptionTitle) === selectedFirstOption)
  }, [variants, firstOptionTitle, selectedFirstOption, isMultiOption])

  // ── Multi-option layout ──────────────────────────────────────────────────
  if (isMultiOption) {
    return (
      <div className="space-y-4">
        {/* Step 1: first option (Größe) */}
        <div>
          <p className="text-sm font-medium text-zinc-700 mb-2">
            {firstOptionTitle} wählen
          </p>
          <div className="flex flex-wrap gap-2">
            {firstOptionValues.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setSelectedFirstOption(val === selectedFirstOption ? null : val)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                  selectedFirstOption === val
                    ? "border-seyfarth-blue bg-blue-50 ring-2 ring-blue-200 text-seyfarth-blue"
                    : "border-zinc-200 bg-white hover:border-zinc-300 text-zinc-700"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: second option (Abfallart) */}
        {selectedFirstOption && (
          <div>
            <p className="text-sm font-medium text-zinc-700 mb-2">
              {secondOptionTitle} wählen
            </p>
            <div className="space-y-3">
              {filteredVariants.map((variant: any) => {
                const price =
                  variant.calculated_price?.calculated_amount ??
                  variant.prices?.[0]?.amount ??
                  0
                const isSelected = selectedId === variant.id
                const abfallart = getAbfallart(variant)
                const isHazardous = HAZARDOUS_WASTE_TYPES.has(abfallart)

                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => onSelect(variant)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? isHazardous
                          ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                          : "border-seyfarth-blue bg-blue-50 ring-2 ring-blue-200"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? isHazardous
                                ? "border-red-500"
                                : "border-seyfarth-blue"
                              : "border-zinc-300"
                          }`}
                        >
                          {isSelected && (
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                isHazardous ? "bg-red-500" : "bg-seyfarth-blue"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <span className={`font-medium flex items-center gap-1.5 ${
                            isHazardous ? "text-red-700" : "text-zinc-900"
                          }`}>
                            {isHazardous && <AlertTriangle className="h-4 w-4 text-red-500" />}
                            {abfallart}
                          </span>
                          {variant.sku && (
                            <span className="text-xs text-zinc-400 block mt-0.5">
                              Art.-Nr. {variant.sku}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`font-semibold ${
                        isHazardous ? "text-red-700" : "text-zinc-900"
                      }`}>
                        {formatPrice(price)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Single-option layout (previous behaviour) ────────────────────────────
  return (
    <div className="space-y-3">
      {variants.map((variant: any) => {
        const price =
          variant.calculated_price?.calculated_amount ??
          variant.prices?.[0]?.amount ??
          0
        const isSelected = selectedId === variant.id
        const isHazardous = HAZARDOUS_WASTE_TYPES.has(variant.title)

        return (
          <button
            key={variant.id}
            type="button"
            onClick={() => onSelect(variant)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
              isSelected
                ? isHazardous
                  ? "border-red-500 bg-red-50 ring-2 ring-red-200"
                  : "border-seyfarth-blue bg-blue-50 ring-2 ring-blue-200"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? isHazardous
                        ? "border-red-500"
                        : "border-seyfarth-blue"
                      : "border-zinc-300"
                  }`}
                >
                  {isSelected && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isHazardous ? "bg-red-500" : "bg-seyfarth-blue"
                      }`}
                    />
                  )}
                </div>
                <div>
                  <span className={`font-medium flex items-center gap-1.5 ${
                    isHazardous ? "text-red-700" : "text-zinc-900"
                  }`}>
                    {isHazardous && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    {variant.title || "Standard"}
                  </span>
                  {variant.sku && (
                    <span className="text-xs text-zinc-400 block mt-0.5">
                      Art.-Nr. {variant.sku}
                    </span>
                  )}
                </div>
              </div>
              <span className={`font-semibold ${
                isHazardous ? "text-red-700" : "text-zinc-900"
              }`}>
                {formatPrice(price)}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
