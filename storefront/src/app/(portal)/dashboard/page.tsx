"use client"
import { useEffect, useState } from "react"
import { medusa } from "@/lib/medusa"
import { useAuth } from "@/lib/auth"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, ClipboardList, MapPin } from "lucide-react"

export default function DashboardPage() {
  const { customer } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [orderCount, setOrderCount] = useState(0)

  useEffect(() => {
    medusa.store.order.list({ limit: 5 })
      .then(({ orders, count }: any) => {
        setOrders(orders)
        setOrderCount(count)
      })
      .catch(() => {})
  }, [])

  return (
    <PortalShell>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">
            Willkommen, {customer?.first_name}
          </h2>
          <p className="text-muted-foreground">
            {customer?.company_name} — Übersicht
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/orders/new">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <Plus className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Neuer Auftrag</p>
                  <p className="text-sm text-muted-foreground">Container bestellen</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/orders">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <ClipboardList className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{orderCount} Aufträge</p>
                  <p className="text-sm text-muted-foreground">Alle anzeigen</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/locations">
            <Card className="hover:border-primary cursor-pointer transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <MapPin className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">Lieferorte</p>
                  <p className="text-sm text-muted-foreground">Verwalten</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Aufträge</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Aufträge vorhanden.</p>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">#{order.display_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
