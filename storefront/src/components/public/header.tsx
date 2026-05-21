"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ExternalLink, Menu, Phone, X } from "lucide-react"
import { useState } from "react"

const MAIN_WEBSITE_URL = process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL || "https://containerdienst-seyfarth.onepage.me/"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="seyfarth-public-header sticky top-0 z-40 bg-transparent px-4 pt-4">
      <div className="mx-auto flex h-20 max-w-[1180px] items-center justify-between rounded-2xl border border-white/80 bg-white/95 px-5 shadow-[0_18px_45px_rgba(7,31,63,0.18)] backdrop-blur md:h-[88px] md:px-7">
        <Link href="/" className="shrink-0">
          <Image src="/logo-seyfarth.png" alt="Seyfarth Container-Dienst GmbH" width={280} height={93} className="h-11 w-auto md:h-12" priority />
        </Link>

        <nav className="hidden items-center gap-6 md:flex lg:gap-8">
          <Link href="/#katalog" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">Containerdienst</Link>
          <Link href="/#entsorgung" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">Entsorgung</Link>
          <a href={MAIN_WEBSITE_URL} className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">
            <span>Recyclinghof</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </a>
          <a href="tel:03449155200" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">Kontakt</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild className="hidden rounded-[14px] bg-seyfarth-blue px-5 py-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(31,123,255,0.28)] hover:bg-seyfarth-navy sm:inline-flex">
            <Link href="/#katalog">Container anfragen</Link>
          </Button>
          <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-seyfarth-navy hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue md:hidden" aria-label="Menü öffnen oder schließen" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mx-auto mt-2 space-y-3 rounded-2xl border border-zinc-100 bg-white px-6 py-4 shadow-xl md:hidden">
          <a href={MAIN_WEBSITE_URL} className="flex items-center gap-2 py-2 text-sm text-zinc-500" onClick={() => setMobileMenuOpen(false)}>← Zur Hauptseite <ExternalLink className="h-3 w-3" /></a>
          <Link href="/#katalog" className="block border-t border-zinc-100 py-2 text-sm text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}>Anfrage</Link>
          <Link href="/#entsorgung" className="block border-t border-zinc-100 py-2 text-sm text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}>Entsorgung</Link>
          <a href="tel:03449155200" className="flex items-center gap-2 border-t border-zinc-100 py-2 text-sm text-seyfarth-navy"><Phone className="h-4 w-4" />034491 5520-0</a>
        </div>
      )}
    </header>
  )
}
