import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { AdminShell } from "@/components/admin/admin-shell"

const MODE_LABELS: Record<string, string> = { entsorgung: "Entsorgung", baustoffe: "Baustoffe", transport: "Transport" }

export default async function AdminAnfragenPage() {
  const { supabase, user } = await requireStaff()

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
    <AdminShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-seyfarth-blue">Backoffice</p>
        <h1 className="text-2xl font-extrabold text-seyfarth-navy">Anfragen</h1>
      </div>

      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Alle Anfragen</CardTitle>
          <CardDescription>Aus dem öffentlichen Konfigurator, von Gästen und Kunden. Statuspflege folgt als eigene Ausbaustufe.</CardDescription>
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
    </AdminShell>
  )
}
