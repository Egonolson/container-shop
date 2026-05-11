import { CATEGORY_CONFIG, CategoryKey, deriveCategory } from "./catalog-types"

interface CategorySidebarProps {
  products: any[]
  activeCategory: CategoryKey | null
  onSelect: (category: CategoryKey | null) => void
}

function getCategoryCounts(products: any[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const product of products) {
    const cat = deriveCategory(product.handle || "")
    counts[cat] = (counts[cat] || 0) + 1
  }
  return counts
}

/** Desktop: vertical sticky sidebar */
function DesktopSidebar({ products, activeCategory, onSelect }: CategorySidebarProps) {
  const counts = getCategoryCounts(products)

  return (
    <nav className="hidden lg:block w-56 flex-shrink-0 h-full">
      <div className="sticky top-24 space-y-1">
        {/* Alle Kategorien */}
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeCategory === null
              ? "bg-seyfarth-navy/10 text-seyfarth-navy border-l-2 border-seyfarth-yellow"
              : "text-zinc-600 hover:bg-zinc-50 hover:text-seyfarth-navy"
          }`}
        >
          Alle Kategorien
          <span className="ml-auto float-right text-xs opacity-60">{products.length}</span>
        </button>

        {CATEGORY_CONFIG.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeCategory === cat.key
                ? "bg-seyfarth-navy/10 text-seyfarth-navy border-l-2 border-seyfarth-yellow"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-seyfarth-navy"
            }`}
          >
            {cat.label}
            <span className="ml-auto float-right text-xs opacity-60">{counts[cat.key] || 0}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

/** Mobile/Tablet: horizontal scrollable tabs */
function MobileTabs({ products, activeCategory, onSelect }: CategorySidebarProps) {
  const counts = getCategoryCounts(products)

  return (
    <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
          activeCategory === null
            ? "bg-seyfarth-navy text-white"
            : "bg-white text-zinc-600 border border-zinc-200 hover:border-seyfarth-navy hover:text-seyfarth-navy"
        }`}
      >
        Alle ({products.length})
      </button>

      {CATEGORY_CONFIG.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeCategory === cat.key
              ? "bg-seyfarth-navy text-white"
              : "bg-white text-zinc-600 border border-zinc-200 hover:border-seyfarth-navy hover:text-seyfarth-navy"
          }`}
        >
          {cat.label} ({counts[cat.key] || 0})
        </button>
      ))}
    </div>
  )
}

export function CategorySidebar(props: CategorySidebarProps) {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileTabs {...props} />
    </>
  )
}
