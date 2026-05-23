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
      className="fixed bottom-4 left-4 right-4 z-[65] md:left-auto md:right-6 md:max-w-md"
    >
      <div className="rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_60px_rgba(7,31,63,0.18)] backdrop-blur">
        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
          Diese Website verwendet ausschließlich technisch notwendige Cookies für die Funktion des Shops.{" "}
          <Link href="/datenschutz" className="text-seyfarth-blue underline hover:text-seyfarth-navy">
            Datenschutzerklärung
          </Link>
        </p>
        <button
          onClick={accept}
          className="mt-3 w-full rounded-full bg-seyfarth-navy px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-seyfarth-blue sm:w-auto"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
