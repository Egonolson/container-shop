"use client"
import dynamic from "next/dynamic"

const CartSheet = dynamic(() => import("./cart-sheet").then(m => m.CartSheet), { ssr: false })

/**
 * EmbedCartBar — fixed weißer Header-Streifen mit nur dem Warenkorb-Icon.
 * Erscheint oben rechts, kein Logo, kein Nav, kein Branding.
 * Ein Spacer verhindert dass der Inhalt hinter dem Header verschwindet.
 */
export function EmbedCartBar() {
  return (
    <>
      {/* Fixed Header */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "52px",
          background: "#ffffff",
          borderBottom: "1px solid #f1f5f9",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 16px",
          zIndex: 9999,
        }}
      >
        <CartSheet checkoutBasePath="/embed" />
      </header>

      {/* Spacer — verhindert Überlappung mit dem Content */}
      <div style={{ height: "52px" }} aria-hidden="true" />
    </>
  )
}
