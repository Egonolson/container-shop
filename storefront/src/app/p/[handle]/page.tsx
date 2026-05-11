import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getProductByHandle } from "@/lib/medusa-server"
import { ProductLandingContent } from "@/components/public/product-landing/product-landing-content"
import { getMinPrice, formatPrice } from "@/components/public/catalog/catalog-types"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8000"
const SITE_NAME = "Seyfarth Container-Dienst"

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    return { title: `Produkt nicht gefunden | ${SITE_NAME}` }
  }

  const minPrice = getMinPrice(product)
  const priceText = minPrice !== null ? ` ab ${formatPrice(minPrice)}` : ""
  const title = `${product.title}${priceText} | ${SITE_NAME}`
  const description =
    product.description || `${product.title} bestellen bei ${SITE_NAME}`
  const url = `${SITE_URL}/p/${handle}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "de_DE",
      images: product.thumbnail
        ? [{ url: product.thumbnail, width: 1200, height: 630 }]
        : [{ url: `${SITE_URL}/logo-seyfarth.png`, width: 400, height: 400 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.thumbnail ? [product.thumbnail] : [`${SITE_URL}/logo-seyfarth.png`],
    },
    other: {
      ...(minPrice !== null
        ? {
            "product:price:amount": (minPrice / 100).toFixed(2),
            "product:price:currency": "EUR",
          }
        : {}),
      "product:availability": "instock",
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params
  const product = await getProductByHandle(handle)

  if (!product) {
    notFound()
  }

  // Build JSON-LD structured data for SEO / rich previews.
  // All values come from our own Medusa product catalog (server-controlled).
  const minPrice = getMinPrice(product)
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.thumbnail || undefined,
    url: `${SITE_URL}/p/${handle}`,
    brand: { "@type": "Organization", name: SITE_NAME },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: minPrice !== null ? (minPrice / 100).toFixed(2) : undefined,
      availability: "https://schema.org/InStock",
    },
  })

  return (
    <>
      {/* eslint-disable-next-line react/no-danger -- server-controlled product data, not user input */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <ProductLandingContent product={product} />
    </>
  )
}
