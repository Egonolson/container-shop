"use client"
import { Suspense } from "react"
import { EmbedCartBar } from "@/components/public/embed-cart-bar"
import dynamic from "next/dynamic"

const LoginPage = dynamic(() => import("@/app/login/page"), { ssr: false })

export default function EmbedLoginPage() {
  return (
    <div data-embed>
      <EmbedCartBar />
      <Suspense fallback={<div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-seyfarth-blue border-t-transparent rounded-full" /></div>}>
        <LoginPage />
      </Suspense>
    </div>
  )
}
