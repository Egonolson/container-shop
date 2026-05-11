"use client"
import { useEffect, useState } from "react"
import { ShoppingCart, Check } from "lucide-react"

interface CartToastProps {
  productTitle: string
  variantTitle: string
  visible: boolean
}

/**
 * Kleiner Toast der nach "In den Warenkorb" erscheint.
 * Erscheint unten-rechts, auto-dismiss nach 2,5 Sek.
 */
export function CartToast({ productTitle, variantTitle, visible }: CartToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const t = setTimeout(() => setShow(false), 2500)
      return () => clearTimeout(t)
    }
  }, [visible])

  if (!show) return null

  return (
    <div className="fixed bottom-20 right-4 z-[60] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-seyfarth-navy text-white px-4 py-3 rounded-2xl shadow-xl max-w-xs">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-blue-200 font-medium">In den Warenkorb</p>
          <p className="text-sm font-semibold truncate">{productTitle}</p>
          {variantTitle && (
            <p className="text-xs text-blue-300 truncate">{variantTitle}</p>
          )}
        </div>
        <ShoppingCart className="h-5 w-5 text-seyfarth-yellow shrink-0" strokeWidth={1.5} />
      </div>
    </div>
  )
}
