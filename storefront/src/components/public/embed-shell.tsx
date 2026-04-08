"use client"
/**
 * EmbedShell — Wrapper für alle Seiten innerhalb des iframes
 * Kein Header, kein Footer, kein Cookie-Banner.
 * Nur ein minimal-sticky Warenkorb-Icon oben rechts.
 */
import dynamic from "next/dynamic"
import { ReactNode } from "react"

const CartSheet = dynamic(() => import("./cart-sheet").then(m => m.CartSheet), { ssr: false })

export function EmbedShell({ children }: { children: ReactNode }) {
  return (
    <div data-embed className="min-h-screen bg-white font-sans">
      {/* Nur Warenkorb — sticky, minimalistisch */}
      <div className="sticky top-0 z-40 flex justify-end px-4 py-3 bg-white/90 backdrop-blur border-b border-zinc-100">
        <CartSheet />
      </div>

      <main>{children}</main>
    </div>
  )
}
