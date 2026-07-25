import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { AdminShell } from "@/components/admin/admin-shell"
import { SmtpForm } from "./smtp-form"

export default async function AdminSmtpPage() {
  const { supabase, user } = await requireStaff()

  const { data } = await supabase
    .from("app_smtp_settings")
    .select("host, port, secure, username, password_cipher, from_email, from_name")
    .eq("id", 1)
    .single()

  const settings = {
    host: data?.host ?? null,
    port: data?.port ?? 587,
    secure: data?.secure ?? false,
    username: data?.username ?? null,
    from_email: data?.from_email ?? null,
    from_name: data?.from_name ?? "Containerdienst Seyfarth",
    hasPassword: !!data?.password_cipher,
  }

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-seyfarth-blue">Backoffice</p>
        <h1 className="text-2xl font-extrabold text-seyfarth-navy">SMTP / E-Mail</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-seyfarth-navy">SMTP / E-Mail-Versand</CardTitle>
          <CardDescription>
            Zugangsdaten für den E-Mail-Versand. Werden für Anfrage-Benachrichtigungen und Eingangsbestätigungen genutzt.
            Das Passwort wird verschlüsselt gespeichert und nie angezeigt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmtpForm settings={settings} defaultTestTo={settings.from_email ?? ""} />
        </CardContent>
      </Card>
    </AdminShell>
  )
}
