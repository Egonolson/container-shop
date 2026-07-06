import "server-only"
import nodemailer from "nodemailer"
import { createAdminClient } from "@/lib/supabase/admin"
import { decryptSecret } from "@/lib/crypto"

export type SmtpSettings = {
  host: string | null
  port: number
  secure: boolean
  username: string | null
  password_cipher: string | null
  from_email: string | null
  from_name: string
}

// Loads the admin-managed SMTP config (bypasses RLS via the service role, so
// it also works from the anonymous guest inquiry path).
export async function loadSmtpSettings(): Promise<SmtpSettings | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("app_smtp_settings")
    .select("host, port, secure, username, password_cipher, from_email, from_name")
    .eq("id", 1)
    .single()
  return data ?? null
}

export function isSmtpConfigured(s: SmtpSettings | null): s is SmtpSettings {
  return !!(s && s.host && s.from_email)
}

function transportFrom(s: SmtpSettings) {
  const password = s.password_cipher ? decryptSecret(s.password_cipher) : undefined
  return nodemailer.createTransport({
    host: s.host!,
    port: s.port,
    secure: s.secure,
    auth: s.username && password ? { user: s.username, pass: password } : undefined,
  })
}

export type MailInput = { to: string; subject: string; text: string; html?: string }

// Sends via the stored settings. Returns {ok} — callers in non-critical paths
// (inquiry notifications) should not fail the request when mail fails.
export async function sendMail(input: MailInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await loadSmtpSettings()
    if (!isSmtpConfigured(settings)) return { ok: false, error: "SMTP ist noch nicht konfiguriert." }
    const transport = transportFrom(settings)
    await transport.sendMail({
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler beim Mailversand." }
  }
}
