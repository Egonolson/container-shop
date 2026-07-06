import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { adminLogoutAction } from "./actions"

export default async function AdminDashboardPage() {
  const { supabase, user } = await requireStaff()

  const { data: customers } = await supabase
    .from("customer_profiles")
    .select("*")
    .order("created_at", { ascending: false })

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
            Grundgerüst des Admin-Backends (R1). Anfragen-Inbox, ERP-Bestandskunden-Matching (F2) und
            Katalog-Freigabe (F3) folgen als eigene Ausbaustufen, sobald die CoTraS-Schnittstelle steht.
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
    </main>
  )
}
