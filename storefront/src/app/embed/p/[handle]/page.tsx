"use client"
import { Suspense, useState, useEffect, use } from "react"
import { EmbedCartBar } from "@/components/public/embed-cart-bar"
import { getProductByHandle } from "@/lib/medusa-server"
import { ProductLandingContent } from "@/components/public/product-landing/product-landing-content"

interface Props {
  params: Promise<{ handle: string }>
}

function EmbedProductContent({ handle }: { handle: string }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProductByHandle(handle)
      .then(setProduct)
      .finally(() => setLoading(false))
  }, [handle])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-seyfarth-blue border-t-transparent rounded-full" />
      </div>
    )
  }
  if (!product) {
    return <div className="text-center py-16 text-zinc-400">Produkt nicht gefunden</div>
  }
  return <ProductLandingContent product={product} />
}

export default function EmbedProductPage({ params }: Props) {
  const { handle } = use(params)
  return (
    <div data-embed>
      <EmbedCartBar />
      <Suspense fallback={
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-seyfarth-blue border-t-transparent rounded-full" />
        </div>
      }>
        <EmbedProductContent handle={handle} />
      </Suspense>
    </div>
  )
}
