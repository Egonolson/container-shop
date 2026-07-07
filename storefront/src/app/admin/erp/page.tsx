import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { createRawAdminClient } from "@/lib/supabase/admin"
import { ErpConnectionForm, ErpRunButtons } from "./erp-controls"
import { decideMatchAction } from "./actions"

const MIRRORS: { table: string; label: string }[] = [
  { table: "erp_customers", label: "Kunden" },
  { table: "erp_articles", label: "Artikel" },
  { table: "erp_container_types", label: "Containertypen" },
  { table: "erp_transport_zones", label: "Zonen" },
  { table: "erp_zone_locations", label: "PLZ-Zonen" },
  { table: "erp_construction_sites", label: "Baustellen" },
  { table: "erp_invoices", label: "Rechnungen" },
]

export default async function AdminErpPage() {
  const { supabase } = await requireStaff()

  const { data: conn } = await supabase.from("erp_connection").select("base_url, enabled, api_key_cipher").eq("id", 1).single()
  // Mirror tables are chosen at runtime, so the typed client can't validate the
  // table name — use the untyped service-role client (staff already verified).
  const raw = createRawAdminClient()
  const counts = await Promise.all(
    MIRRORS.map(async (m) => ({ ...m, count: (await raw.from(m.table).select("*", { count: "exact", head: true })).count ?? 0 })),
  )
  const { data: runs } = await supabase.from("sync_runs").select("entity, source, status, inserted, updated, deleted, errors, started_at").order("started_at", { ascending: false }).limit(10)
  const { data: pending } = await supabase.from("customer_erp_links").select("id, customer_id, erp_customer_id, score, matched_fields, candidates, status").eq("status", "pending").limit(25)

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-seyfarth-blue">
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Backoffice
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">ERP-Anbindung (CoTraS)</CardTitle>
          <CardDescription>
            Grundgerüst steht: Spiegel, Sync, Abgleich und diese Oberfläche laufen. Solange die echte Schnittstelle nicht
            aktiv ist, arbeitet der Sync mit Mock-Daten. Später nur den echten Adapter aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ErpConnectionForm baseUrl={conn?.base_url ?? ""} enabled={conn?.enabled ?? false} hasKey={!!conn?.api_key_cipher} />
          <div className="border-t border-zinc-100 pt-4">
            <ErpRunButtons />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Spiegel-Bestand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {counts.map((m) => (
              <div key={m.table} className="rounded-xl border border-zinc-100 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-400">{m.label}</p>
                <p className="text-lg font-semibold text-seyfarth-navy">{m.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Letzte Sync-Läufe</CardTitle>
        </CardHeader>
        <CardContent>
          {!runs || runs.length === 0 ? (
            <p className="text-sm text-zinc-500">Noch keine Läufe.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entität</TableHead>
                  <TableHead>Quelle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>+/~/−</TableHead>
                  <TableHead>Fehler</TableHead>
                  <TableHead>Zeit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.entity}</TableCell>
                    <TableCell>{r.source}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    <TableCell>{r.inserted}/{r.updated}/{r.deleted}</TableCell>
                    <TableCell>{r.errors}</TableCell>
                    <TableCell>{new Date(r.started_at).toLocaleString("de-DE")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Kunden-Freigabe-Queue</CardTitle>
          <CardDescription>Konten, die nicht automatisch eindeutig einem ERP-Kunden zugeordnet werden konnten.</CardDescription>
        </CardHeader>
        <CardContent>
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-zinc-500">Keine offenen Freigaben.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((p) => {
                const candidates = (p.candidates ?? []) as { erp_customer_id: string; score: number; fields: string[] }[]
                return (
                  <div key={p.id} className="rounded-xl border border-zinc-100 p-3">
                    <p className="text-xs text-zinc-500">Konto {p.customer_id.slice(0, 8)}… · Score {p.score ?? 0}</p>
                    {candidates.length === 0 ? (
                      <p className="mt-1 text-sm text-zinc-500">Keine ERP-Kandidaten gefunden.</p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {candidates.map((c) => (
                          <form key={c.erp_customer_id} action={decideMatchAction} className="flex items-center justify-between gap-2 text-sm">
                            <span>
                              <span className="font-mono">{c.erp_customer_id}</span> · Score {c.score} · {c.fields.join(", ")}
                            </span>
                            <span className="flex gap-1">
                              <input type="hidden" name="id" value={p.id} />
                              <input type="hidden" name="erpCustomerId" value={c.erp_customer_id} />
                              <input type="hidden" name="decision" value="confirmed" />
                              <Button type="submit" size="sm" variant="outline" className="rounded-lg">Verknüpfen</Button>
                            </span>
                          </form>
                        ))}
                      </div>
                    )}
                    <form action={decideMatchAction} className="mt-2">
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="decision" value="rejected" />
                      <Button type="submit" size="sm" variant="ghost" className="rounded-lg text-zinc-500">Als Neukunde belassen</Button>
                    </form>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
