import { AlertTriangle, X } from "lucide-react"
import { HAZARDOUS_WASTE_TYPES } from "./catalog-types"

interface WasteTypeFilterBarProps {
  wasteTypes: string[]
  activeWasteTypes: Set<string>
  onToggle: (type: string) => void
  onReset: () => void
}

export function WasteTypeFilterBar({
  wasteTypes,
  activeWasteTypes,
  onToggle,
  onReset,
}: WasteTypeFilterBarProps) {
  const hasActiveFilters = activeWasteTypes.size > 0

  return (
    <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
      {wasteTypes.map((type) => {
        const isHazardous = HAZARDOUS_WASTE_TYPES.has(type)
        const isActive = activeWasteTypes.has(type)

        let chipClass: string
        if (isHazardous) {
          chipClass = isActive
            ? "bg-red-50 border-red-500 text-red-700"
            : "bg-white border-red-200 text-red-700 hover:border-red-400"
        } else {
          chipClass = isActive
            ? "bg-seyfarth-blue/10 border-seyfarth-blue text-seyfarth-blue"
            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
        }

        return (
          <button
            key={type}
            onClick={() => onToggle(type)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all duration-200 whitespace-nowrap cursor-pointer ${chipClass}`}
          >
            {isHazardous && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
            {type}
          </button>
        )
      })}

      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm border border-zinc-300 text-zinc-500 hover:bg-zinc-100 transition-all duration-200 whitespace-nowrap cursor-pointer"
        >
          <X className="h-3 w-3" />
          Filter zurücksetzen
        </button>
      )}
    </div>
  )
}
