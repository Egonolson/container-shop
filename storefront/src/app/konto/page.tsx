import { UserRound } from "lucide-react"
import { PublicShell } from "@/components/public/public-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { requireUser } from "@/lib/supabase/auth-guards"
import { logoutAction } from "./actions"
import { ProfileForm } from "./profile-form"

const MODE_LABELS: Record<string, string> = { entsorgung: "Entsorgung", baustoffe: "Baustoffe", transport: "Transport" }

export default async function KontoPage() {
  const { supabase, user } = await requireUser()

  const { data: profile } = await supabase.from("customer_profiles").select("*").eq("id", user.id).single()
  const { data: requests } = await supabase
    .from("shop_requests")
    .select("id, reference, mode, status, created_at")
    .order("created_at", { ascending: false })

  if (!profile) {
    // Should not happen — the signup trigger always creates a profile row.
    return (
      <PublicShell>
        <section className="bg-zinc-50 py-16">
          <div className="mx-auto max-w-2xl px-4">
            <p className="text-destructive">Profil konnte nicht geladen werden.</p>
          </div>
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <section className="bg-zinc-50 py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-6 px-4">
          <div className="mb-2 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-seyfarth-blue/10 text-seyfarth-blue">
              <UserRound className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Seyfarth Kundenportal</p>
              <h1 className="font-headline text-2xl font-extrabold text-seyfarth-navy md:text-3xl">Mein Konto</h1>
            </div>
          </div>

          <Card className="rounded-[28px] border-zinc-100 shadow-sm">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle className="text-xl text-seyfarth-navy">Profil</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
              <Badge variant="secondary">{profile.customer_kind === "private" ? "Privatkunde" : "Gewerbekunde"}</Badge>
            </CardHeader>
            <CardContent>
              <ProfileForm profile={profile} />
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-zinc-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-seyfarth-navy">Meine Anfragen</CardTitle>
              <CardDescription>Anfragen, die Sie über den Konfigurator eingereicht haben.</CardDescription>
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
                      <TableHead>Status</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
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

          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="rounded-xl">
              Abmelden
            </Button>
          </form>
        </div>
      </section>
    </PublicShell>
  )
}
