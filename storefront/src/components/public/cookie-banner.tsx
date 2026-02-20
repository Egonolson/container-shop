"use client"
import { useState, useEffect } from "react"

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
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 bg-white border-t border-zinc-200 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-zinc-600 flex-1">
          Diese Website verwendet ausschliesslich technisch notwendige Cookies fuer die Funktion des Shops.
          Weitere Informationen finden Sie in unserer{" "}
          <a href="/datenschutz" className="text-seyfarth-blue underline">Datenschutzerklaerung</a>.
        </p>
        <button
          onClick={accept}
          className="px-6 py-2 bg-seyfarth-blue text-white text-sm font-medium rounded-full hover:bg-seyfarth-navy transition-colors shrink-0"
        >
          Verstanden
        </button>
      </div>
    </div>
  )
}
