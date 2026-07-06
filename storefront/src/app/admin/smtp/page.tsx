import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { SmtpForm } from "./smtp-form"

export default async function AdminSmtpPage() {
  const { supabase } = await requireStaff()

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
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-seyfarth-blue">
        <ArrowLeft className="h-4 w-4" />
        Zurück zum Backoffice
      </Link>

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
    </main>
  )
}
