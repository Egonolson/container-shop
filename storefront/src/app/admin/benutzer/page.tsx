import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireAdmin } from "@/lib/supabase/auth-guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminShell } from "@/components/admin/admin-shell"
import { InviteStaffForm, RoleForm, RevokeAccessButton } from "./user-controls"

export default async function AdminBenutzerPage() {
  const { user } = await requireAdmin()

  const admin = createAdminClient()
  const { data: profiles } = await admin
    .from("customer_profiles")
    .select("id, role, first_name, last_name, created_at")
    .in("role", ["staff", "admin"])
    .order("created_at", { ascending: true })

  // customer_profiles has no email column — GoTrue is the source of truth for
  // that, so it's fetched separately via the admin API and joined in memory.
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 })
  const emailById = new Map(authList?.users.map((u) => [u.id, u.email ?? "—"]) ?? [])

  const accounts = (profiles ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? "—" }))

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-seyfarth-blue">Backoffice</p>
        <h1 className="text-2xl font-extrabold text-seyfarth-navy">Benutzerverwaltung</h1>
      </div>

      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Neues Konto anlegen</CardTitle>
          <CardDescription>
            Legt einen Backoffice-Zugang mit temporärem Passwort an und versendet die Zugangsdaten per E-Mail
            (sofern SMTP konfiguriert ist).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteStaffForm />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Mitarbeiter- &amp; Admin-Konten</CardTitle>
          <CardDescription>Nur Konten mit Backoffice-Zugriff. Kundenkonten werden unter „Kunden“ verwaltet.</CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Mitarbeiter-Konten.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Seit</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{[a.first_name, a.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="text-sm">{a.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.role === "admin" ? "Admin" : "Mitarbeiter"}</Badge>
                    </TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString("de-DE")}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <RoleForm id={a.id} currentRole={a.role} />
                        <RevokeAccessButton id={a.id} email={a.email} />
                      </div>
                    </TableCell>
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
