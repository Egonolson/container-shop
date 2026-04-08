"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      data-cookie-banner
      className="fixed bottom-0 inset-x-0 z-[65] p-3 md:p-4 bg-white border-t border-zinc-200 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs sm:text-sm text-zinc-600 flex-1 leading-relaxed">
          Diese Website verwendet ausschließlich technisch notwendige Cookies für die Funktion des Shops.{" "}
          <Link href="/datenschutz" className="text-seyfarth-blue underline hover:text-seyfarth-navy">
            Datenschutzerklärung
          </Link>
        </p>
        <button
          onClick={accept}
          className="self-end sm:self-auto px-5 py-1.5 bg-seyfarth-navy text-white text-sm font-medium rounded-full hover:bg-seyfarth-blue transition-colors shrink-0"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
