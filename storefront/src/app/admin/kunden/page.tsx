import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function AdminKundenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { supabase, user } = await requireStaff()
  const { q } = await searchParams
  const query = (q ?? "").trim()
  // PostgREST's .or() filter DSL treats "," and "()" as syntax, not literal
  // search characters — strip them so a search term can't break the filter.
  const safeQuery = query.replace(/[,()]/g, "")

  let request = supabase
    .from("customer_profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false })

  if (safeQuery) {
    request = request.or(
      `first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%,company_name.ilike.%${safeQuery}%,vat_id.ilike.%${safeQuery}%,postal_code.ilike.%${safeQuery}%,city.ilike.%${safeQuery}%`,
    )
  }

  const { data: customers } = await request

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-seyfarth-blue">Backoffice</p>
        <h1 className="text-2xl font-extrabold text-seyfarth-navy">Kunden</h1>
      </div>

      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Registrierte Kunden</CardTitle>
          <CardDescription>Privat- und Gewerbekunden mit eigenem Konto im Kundenportal.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="max-w-sm">
            <Input name="q" defaultValue={query} placeholder="Name, Firma, USt-IdNr., PLZ oder Ort suchen …" />
          </form>

          {!customers || customers.length === 0 ? (
            <p className="text-sm text-zinc-500">{query ? "Keine Treffer für diese Suche." : "Noch keine registrierten Kunden."}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>USt-IdNr.</TableHead>
                  <TableHead>PLZ / Ort</TableHead>
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
                      <Badge variant="secondary">{customer.customer_kind === "private" ? "Privat" : "Gewerblich"}</Badge>
                    </TableCell>
                    <TableCell>{customer.vat_id || "—"}</TableCell>
                    <TableCell>{customer.postal_code ? `${customer.postal_code} ${customer.city ?? ""}` : "—"}</TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString("de-DE")}</TableCell>
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
