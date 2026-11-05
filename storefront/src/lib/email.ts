import "server-only"
import nodemailer from "nodemailer"
import { createAdminClient } from "@/lib/supabase/admin"
import { decryptSecret } from "@/lib/crypto"
import { mailMessageFrom, smtpOptionsFrom, type MailInput, type SmtpSettings } from "./email-message"
export type { MailInput, SmtpSettings } from "./email-message"

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

export function isSmtpConfigured(s: SmtpSettings | null): s is SmtpSettings & { host: string; from_email: string } {
  return !!(s && s.host && s.from_email)
}

function transportFrom(s: SmtpSettings) {
  const password = s.password_cipher ? decryptSecret(s.password_cipher) : undefined
  return nodemailer.createTransport(smtpOptionsFrom(s, password))
}

// Sends via the stored settings. Returns {ok} — callers in non-critical paths
// (inquiry notifications) should not fail the request when mail fails.
export async function sendMail(input: MailInput): Promise<{ ok: boolean; error?: string }> {
  try {
    const settings = await loadSmtpSettings()
    if (!isSmtpConfigured(settings)) return { ok: false, error: "SMTP ist noch nicht konfiguriert." }
    const transport = transportFrom(settings)
    await transport.sendMail(mailMessageFrom(settings, input))
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unbekannter Fehler beim Mailversand." }
  }
}
