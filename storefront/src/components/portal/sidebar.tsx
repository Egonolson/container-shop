"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Plus, ClipboardList, MapPin, LogOut } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders/new", label: "Neuer Auftrag", icon: Plus },
  { href: "/orders", label: "Meine Aufträge", icon: ClipboardList },
  { href: "/locations", label: "Lieferorte", icon: MapPin },
]

export function Sidebar() {
  const pathname = usePathname()
  const { customer, logout } = useAuth()

  return (
    <aside className="w-64 bg-white border-r min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Container-Portal</h1>
        <p className="text-sm text-muted-foreground">{customer?.company_name}</p>
      </div>
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
              pathname === item.href ? "bg-primary text-primary-foreground" : "hover:bg-gray-100"
            }`}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Button variant="ghost" onClick={logout} className="justify-start gap-3">
        <LogOut className="h-4 w-4" /> Abmelden
      </Button>
    </aside>
  )
}
