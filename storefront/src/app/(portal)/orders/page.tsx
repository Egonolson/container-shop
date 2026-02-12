"use client"
import { useEffect, useState } from "react"
import { medusa } from "@/lib/medusa"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

const statusLabels: Record<string, string> = {
  pending: "Erstellt",
  confirmed: "Bestätigt",
  dispatched: "Disponiert",
  in_progress: "In Ausführung",
  completed: "Abgeschlossen",
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  confirmed: "secondary",
  dispatched: "secondary",
  in_progress: "default",
  completed: "default",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    medusa.store.order.list({ limit: 50, order: "-created_at" })
      .then(({ orders }: any) => setOrders(orders))
      .catch(() => {})
  }, [])

  return (
    <PortalShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Meine Aufträge</h2>
          <Link href="/orders/new">
            <Button><Plus className="h-4 w-4 mr-2" /> Neuer Auftrag</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Noch keine Aufträge vorhanden.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {orders.map((order: any) => (
              <Card key={order.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Auftrag #{order.display_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("de-DE")} —{" "}
                      {order.items?.[0]?.title || "Container-Service"}
                    </p>
                    {order.metadata?.order_type && (
                      <p className="text-sm capitalize">Art: {order.metadata.order_type}</p>
                    )}
                    {order.metadata?.avv_number && (
                      <p className="text-sm">AVV: {order.metadata.avv_number} — {order.metadata.waste_title}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[order.status] || "outline"}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                    <p className="text-sm font-semibold mt-1">
                      {order.total ? (order.total / 100).toFixed(2) + " EUR" : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
