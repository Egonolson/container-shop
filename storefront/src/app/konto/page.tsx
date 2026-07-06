import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/supabase/auth-guards"
import { logoutAction } from "./actions"
import { ProfileForm } from "./profile-form"

export default async function KontoPage() {
  const { supabase, user } = await requireUser()

  const { data: profile } = await supabase.from("customer_profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    // Should not happen — the signup trigger always creates a profile row.
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-destructive">Profil konnte nicht geladen werden.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl text-seyfarth-navy">Mein Konto</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant="secondary">{profile.customer_kind === "private" ? "Privatkunde" : "Gewerbekunde"}</Badge>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">Meine Anfragen</CardTitle>
          <CardDescription>
            Hier erscheinen künftig Ihre Anfragen und Bestellungen (Welle R3 des Portal-Ausbaus).
          </CardDescription>
        </CardHeader>
      </Card>

      <form action={logoutAction}>
        <Button type="submit" variant="outline">
          Abmelden
        </Button>
      </form>
    </main>
  )
}
