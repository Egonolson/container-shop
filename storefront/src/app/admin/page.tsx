import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { adminLogoutAction } from "./actions"

const MODE_LABELS: Record<string, string> = { entsorgung: "Entsorgung", baustoffe: "Baustoffe", transport: "Transport" }

export default async function AdminDashboardPage() {
  const { supabase, user } = await requireStaff()

  const { data: customers } = await supabase
    .from("customer_profiles")
    .select("*")
    .order("created_at", { ascending: false })

  const { data: requests } = await supabase
    .from("shop_requests")
    .select("id, reference, mode, status, created_at, customer_id")
    .order("created_at", { ascending: false })

  // shop_requests.customer_id references auth.users, not customer_profiles
  // directly, so PostgREST can't embed the join automatically — resolved
  // with a second lookup instead.
  const customerIds = Array.from(new Set((requests ?? []).map((r) => r.customer_id).filter((id): id is string => !!id)))
  const { data: requestCustomers } =
    customerIds.length > 0
      ? await supabase.from("customer_profiles").select("id, customer_kind, first_name, last_name, company_name").in("id", customerIds)
      : { data: [] as { id: string; customer_kind: string; first_name: string | null; last_name: string | null; company_name: string | null }[] }
  const customerById = new Map((requestCustomers ?? []).map((c) => [c.id, c]))

  const customerLabel = (customerId: string | null) => {
    if (!customerId) return "Gast"
    const c = customerById.get(customerId)
    if (!c) return "Gast"
    return (c.customer_kind === "business" ? c.company_name : [c.first_name, c.last_name].filter(Boolean).join(" ")) || "—"
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-seyfarth-navy">Backoffice</h1>
          <p className="text-sm text-zinc-500">Angemeldet als {user.email}</p>
        </div>
        <form action={adminLogoutAction}>
          <Button type="submit" variant="outline">
            Abmelden
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Registrierte Kunden</CardTitle>
          <CardDescription>
            Grundgerüst des Admin-Backends (R1). ERP-Bestandskunden-Matching (F2) und Katalog-Freigabe (F3)
            folgen als eigene Ausbaustufen, sobald die CoTraS-Schnittstelle steht.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!customers || customers.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine registrierten Kunden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>USt-IdNr.</TableHead>
                  <TableHead>PLZ / Ort</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Registriert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      {customer.customer_kind === "business"
                        ? customer.company_name || "—"
                        : [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.customer_kind === "private" ? "Privat" : "Gewerblich"}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.vat_id || "—"}</TableCell>
                    <TableCell>
                      {customer.postal_code ? `${customer.postal_code} ${customer.city ?? ""}` : "—"}
                    </TableCell>
                    <TableCell>{customer.role}</TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString("de-DE")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Anfragen</CardTitle>
          <CardDescription>
            Alle Anfragen aus dem öffentlichen Konfigurator, Gäste und Kunden. Statuspflege folgt als eigene Ausbaustufe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Anfragen vorhanden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referenz</TableHead>
                  <TableHead>Bereich</TableHead>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                    <TableCell>{MODE_LABELS[r.mode] ?? r.mode}</TableCell>
                    <TableCell>{customerLabel(r.customer_id)}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString("de-DE")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
