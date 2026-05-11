"use client"
import { Suspense } from "react"
import { EmbedCartBar } from "@/components/public/embed-cart-bar"

// Lädt den normalen Checkout dynamisch, umhüllt mit EmbedCartBar
import dynamic from "next/dynamic"
const CheckoutPage = dynamic(() => import("@/app/checkout/page"), { ssr: false })

export default function EmbedCheckoutPage() {
  return (
    <div data-embed>
      <EmbedCartBar />
      <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-seyfarth-blue border-t-transparent rounded-full" /></div>}>
        <CheckoutPage />
      </Suspense>
    </div>
  )
}
