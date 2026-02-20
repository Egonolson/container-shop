"use client"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { User, LayoutDashboard, FileText, MapPin, LogOut, ChevronDown, ExternalLink } from "lucide-react"
import { useState, useRef, useEffect } from "react"

const CartSheet = dynamic(() => import("./cart-sheet").then(m => m.CartSheet), {
  ssr: false,
})

const MAIN_WEBSITE_URL = process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL || "https://www.seyfarth-container.de"

export function Header() {
  const { customer } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/logo-seyfarth.png"
            alt="Seyfarth Container-Dienst"
            width={280}
            height={93}
            className="h-10 w-auto"
            priority
          />
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href={MAIN_WEBSITE_URL}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <span>← Zur Hauptseite</span>
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
          </a>
          <Link
            href="/#katalog"
            className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Katalog
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          <CartSheet />

          {customer ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-sm text-zinc-700 hover:text-zinc-900 transition-colors px-3 py-2 rounded-full hover:bg-zinc-100"
              >
                <User className="h-4 w-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Mein Konto</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
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
            <Button asChild variant="ghost" className="text-sm rounded-full">
              <Link href="/login">Anmelden</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
