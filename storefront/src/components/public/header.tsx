"use client"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { User, LayoutDashboard, FileText, MapPin, LogOut, ChevronDown, ExternalLink, Menu, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const CartSheet = dynamic(() => import("./cart-sheet").then(m => m.CartSheet), {
  ssr: false,
})

const MAIN_WEBSITE_URL = process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL || "https://www.seyfarth-container.de"

export function Header() {
  const { customer } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="seyfarth-public-header sticky top-0 z-40 bg-seyfarth-navy shadow-lg">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-seyfarth.png"
            alt="Seyfarth Container-Dienst"
            width={280}
            height={93}
            className="h-10 w-auto brightness-0 invert"
            priority
          />
        </Link>

        {/* Center Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href={MAIN_WEBSITE_URL}
            className="flex items-center gap-1 text-xs text-blue-300/70 hover:text-seyfarth-yellow transition-colors"
          >
            <span>← Zur Hauptseite</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </a>
          <Link
            href="/#katalog"
            className="text-sm text-blue-100 hover:text-seyfarth-yellow transition-colors font-medium"
          >
            Katalog
          </Link>
          <Link
            href="/#entsorgung"
            className="text-sm text-blue-100 hover:text-seyfarth-yellow transition-colors font-medium"
          >
            Entsorgung
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <CartSheet />

          {customer ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-blue-100 hover:text-white transition-colors px-3 py-2 rounded-full hover:bg-white/10"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Mein Konto</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-zinc-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium truncate">{customer.first_name} {customer.last_name}</p>
                    {customer.company_name && (
                      <p className="text-xs text-zinc-500 truncate">{customer.company_name}</p>
                    )}
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
                    Dashboard
                  </Link>
                  <Link
                    href="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <FileText className="h-4 w-4" strokeWidth={1.5} />
                    Aufträge
                  </Link>
                  <Link
                    href="/locations"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                  >
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                    Lieferorte
                  </Link>
                  <div className="border-t border-zinc-100 mt-1 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-500 hover:bg-zinc-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.5} />
                      Abmelden
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              asChild
              className="text-sm rounded-full bg-seyfarth-orange hover:bg-seyfarth-yellow hover:text-seyfarth-navy text-white border-0"
            >
              <Link href="/login">Anmelden</Link>
            </Button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-blue-100 hover:text-white p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-seyfarth-navy/95 border-t border-white/10 px-6 py-4 space-y-3">
          <a
            href={MAIN_WEBSITE_URL}
            className="flex items-center gap-2 text-sm text-blue-300 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            ← Zur Hauptseite <ExternalLink className="h-3 w-3" />
          </a>
          <Link
            href="/#katalog"
            className="block text-sm text-blue-100 py-2 border-t border-white/10"
            onClick={() => setMobileMenuOpen(false)}
          >
            Katalog
          </Link>
          <Link
            href="/#entsorgung"
            className="block text-sm text-blue-100 py-2 border-t border-white/10"
            onClick={() => setMobileMenuOpen(false)}
          >
            Entsorgung
          </Link>
        </div>
      )}
    </header>
  )
}
