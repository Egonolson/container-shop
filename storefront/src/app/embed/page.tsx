"use client"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { medusa } from "@/lib/medusa"
import { useCart } from "@/lib/cart"
import { ProductCatalogSection } from "@/components/public/catalog"
import { CategoryKey } from "@/components/public/catalog/catalog-types"
import { EmbedCartBar } from "@/components/public/embed-cart-bar"

/**
 * /embed — iframe-fähiger Katalog für onepage.me
 *
 * Kein Header, kein Footer, kein Cookie-Banner.
 * Schrift: Albert Sans (= onepage.me Font)
 * Navigation bleibt im iframe: /embed/checkout, /embed/login usw.
 *
 * ?category=bigbag|absetzcontainer|abrollcontainer|spezialcontainer|recyclinghof
 */
function EmbedContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const [addedVariant, setAddedVariant] = useState<string | null>(null)

  const defaultCategory = (searchParams.get("category") as CategoryKey) || null

  // PostMessage-Resize: sendet die Seitenhöhe an den parent (onepage.me)
  // damit der iframe sich automatisch anpasst
  useEffect(() => {
    const sendHeight = () => {
      const h = document.documentElement.scrollHeight
      window.parent?.postMessage({ type: "seyfarth-resize", height: h }, "*")
    }
    // Nach Render + nach Bild-/Font-Laden
    sendHeight()
    window.addEventListener("load", sendHeight)
    const ro = new ResizeObserver(sendHeight)
    ro.observe(document.documentElement)
    return () => { window.removeEventListener("load", sendHeight); ro.disconnect() }
  }, [])

  useEffect(() => {
    medusa.store.region.list({ limit: 1 })
      .then(({ regions }) => {
        const regionId = regions?.[0]?.id
        return medusa.store.product.list({
          limit: 50,
          fields: "+variants.calculated_price",
          ...(regionId ? { region_id: regionId } : {}),
        })
      })
      .then(({ products }) => setProducts(products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAddToCart = (product: any, variant: any) => {
    const price = variant.calculated_price?.calculated_amount
      ?? variant.prices?.[0]?.amount ?? 0
    addItem({
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      variantTitle: variant.title || "Standard",
      price,
      quantity: 1,
    })
    setAddedVariant(variant.id)
    setTimeout(() => setAddedVariant(null), 1500)
  }

  return (
    <div data-embed>
      {/* Nur Warenkorb-Icon — sticky, minimalistisch */}
      <EmbedCartBar />

      <ProductCatalogSection
        products={products}
        loading={loading}
        onAddToCart={handleAddToCart}
        addedVariant={addedVariant}
        defaultCategory={defaultCategory}
        compact={true}
        basePath="/embed"
      />
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 border-4 border-seyfarth-blue border-t-transparent rounded-full" />
      </div>
    }>
      <EmbedContent />
    </Suspense>
  )
}
