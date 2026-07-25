import Link from "next/link"
import { ArrowRight, Inbox, PlugZap, Settings, Users, UsersRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { AdminShell } from "@/components/admin/admin-shell"

const MODE_LABELS: Record<string, string> = { entsorgung: "Entsorgung", baustoffe: "Baustoffe", transport: "Transport" }

const QUICK_LINKS = [
  { href: "/admin/kunden", label: "Kunden", description: "Registrierte Privat- und Gewerbekunden verwalten.", icon: Users },
  { href: "/admin/anfragen", label: "Anfragen", description: "Alle eingehenden Anfragen aus dem Konfigurator.", icon: Inbox },
  { href: "/admin/benutzer", label: "Benutzerverwaltung", description: "Mitarbeiter-Konten einladen und verwalten.", icon: UsersRound },
  { href: "/admin/erp", label: "ERP-Anbindung", description: "CoTraS-Synchronisation und Kunden-Abgleich.", icon: PlugZap },
  { href: "/admin/smtp", label: "SMTP / E-Mail", description: "Versandkonfiguration für Benachrichtigungen.", icon: Settings },
] as const

export default async function AdminDashboardPage() {
  const { supabase, user } = await requireStaff()

  const [{ count: customerCount }, { count: requestCount }, { count: openCount }, { count: staffCount }, { data: recentRequests }] =
    await Promise.all([
      supabase.from("customer_profiles").select("*", { count: "exact", head: true }).eq("role", "customer"),
      supabase.from("shop_requests").select("*", { count: "exact", head: true }),
      supabase.from("shop_requests").select("*", { count: "exact", head: true }).eq("status", "neu"),
      supabase.from("customer_profiles").select("*", { count: "exact", head: true }).in("role", ["staff", "admin"]),
      supabase.from("shop_requests").select("id, reference, mode, status, created_at").order("created_at", { ascending: false }).limit(5),
    ])

  const stats = [
    { label: "Registrierte Kunden", value: customerCount ?? 0, icon: Users },
    { label: "Anfragen gesamt", value: requestCount ?? 0, icon: Inbox },
    { label: "Offene Anfragen", value: openCount ?? 0, icon: Inbox },
    { label: "Mitarbeiter-Konten", value: staffCount ?? 0, icon: UsersRound },
  ]

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-seyfarth-blue">Backoffice</p>
        <h1 className="text-2xl font-extrabold text-seyfarth-navy">Übersicht</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-zinc-100 shadow-sm">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seyfarth-blue/10 text-seyfarth-blue">
                <s.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xl font-bold text-seyfarth-navy">{s.value}</p>
                <p className="text-xs text-zinc-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {QUICK_LINKS.map((q) => (
          <Link key={q.href} href={q.href}>
            <Card className="rounded-2xl border-zinc-100 shadow-sm transition-colors hover:border-seyfarth-blue/30">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-seyfarth-blue/10 text-seyfarth-blue">
                  <q.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-seyfarth-navy">{q.label}</p>
                  <p className="text-xs text-zinc-500">{q.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-2xl border-zinc-100 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-seyfarth-navy">Letzte Anfragen</CardTitle>
            <CardDescription>Die fünf zuletzt eingegangenen Anfragen.</CardDescription>
          </div>
          <Link href="/admin/anfragen" className="text-sm font-medium text-seyfarth-blue">
            Alle anzeigen
          </Link>
        </CardHeader>
        <CardContent>
          {!recentRequests || recentRequests.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Anfragen vorhanden.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referenz</TableHead>
                  <TableHead>Bereich</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRequests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                    <TableCell>{MODE_LABELS[r.mode] ?? r.mode}</TableCell>
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
