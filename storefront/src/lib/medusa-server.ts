const MEDUSA_URL =
  process.env.MEDUSA_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_URL ||
  "http://localhost:9000"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

async function medusaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${MEDUSA_URL}${path}`, {
      headers: {
        "x-publishable-api-key": PUBLISHABLE_KEY,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getRegionId(): Promise<string | null> {
  const data = await medusaFetch<{ regions: { id: string }[] }>(
    "/store/regions?limit=1"
  )
  return data?.regions?.[0]?.id ?? null
}

export async function getProductByHandle(handle: string) {
  const regionId = await getRegionId()
  if (!regionId) return null

  const data = await medusaFetch<{ products: any[] }>(
    `/store/products?handle=${encodeURIComponent(handle)}&fields=+variants.calculated_price&region_id=${regionId}`
  )
  return data?.products?.[0] ?? null
}
