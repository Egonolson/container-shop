"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  LayoutDashboard,
  Menu,
  Package,
  PlugZap,
  Send,
  Settings,
  Users,
  UsersRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { adminLogoutAction } from "@/app/admin/actions"

const NAV_ITEMS = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard },
  { href: "/admin/kunden", label: "Kunden", icon: Users },
  { href: "/admin/anfragen", label: "Anfragen", icon: Package },
  { href: "/admin/benutzer", label: "Benutzerverwaltung", icon: UsersRound },
  { href: "/admin/erp", label: "ERP-Anbindung", icon: PlugZap },
  { href: "/admin/smtp", label: "SMTP / E-Mail", icon: Settings },
] as const

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors " +
              (active
                ? "bg-seyfarth-blue/10 text-seyfarth-blue"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-seyfarth-navy")
            }
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-zinc-100 bg-white px-4 py-6 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2 px-2">
          <Image src="/logo-seyfarth.png" alt="Seyfarth" width={140} height={46} className="h-8 w-auto" priority />
        </Link>
        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Backoffice</p>
        <NavLinks pathname={pathname} />
        <div className="mt-auto space-y-3 border-t border-zinc-100 pt-4">
          <p className="truncate px-3 text-xs text-zinc-400">{userEmail}</p>
          <form action={adminLogoutAction}>
            <Button type="submit" variant="outline" size="sm" className="w-full rounded-xl">
              <Send className="h-3.5 w-3.5 rotate-180" strokeWidth={1.75} />
              Abmelden
            </Button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo-seyfarth.png" alt="Seyfarth" width={120} height={40} className="h-7 w-auto" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-400">Backoffice</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-seyfarth-navy"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 px-4 py-6">
          <SheetTitle className="mb-4 px-2 text-sm text-seyfarth-navy">Backoffice</SheetTitle>
          <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          <div className="mt-6 space-y-3 border-t border-zinc-100 pt-4">
            <p className="truncate px-3 text-xs text-zinc-400">{userEmail}</p>
            <form action={adminLogoutAction}>
              <Button type="submit" variant="outline" size="sm" className="w-full rounded-xl">
                Abmelden
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:py-12">{children}</div>
      </main>
    </div>
  )
}
