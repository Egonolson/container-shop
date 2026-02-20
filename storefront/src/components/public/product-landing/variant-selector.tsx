"use client"

import { AlertTriangle } from "lucide-react"
import { HAZARDOUS_WASTE_TYPES, formatPrice } from "../catalog/catalog-types"

interface VariantSelectorProps {
  variants: any[]
  selectedId: string | null
  onSelect: (variant: any) => void
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
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
