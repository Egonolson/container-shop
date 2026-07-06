"use server"

import { revalidatePath } from "next/cache"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { encryptSecret } from "@/lib/crypto"
import { sendMail } from "@/lib/email"

export type SmtpFormState = { error: string | null; success: string | null }

export async function saveSmtpAction(_prev: SmtpFormState, formData: FormData): Promise<SmtpFormState> {
  const { supabase, user } = await requireStaff()

  const host = ((formData.get("host") as string) || "").trim() || null
  const portRaw = ((formData.get("port") as string) || "").trim()
  const port = Number.parseInt(portRaw, 10)
  const secure = formData.get("secure") === "on"
  const username = ((formData.get("username") as string) || "").trim() || null
  const fromEmail = ((formData.get("fromEmail") as string) || "").trim() || null
  const fromName = ((formData.get("fromName") as string) || "").trim() || "Containerdienst Seyfarth"
  const newPassword = (formData.get("password") as string) || ""

  if (host && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    return { error: "Bitte einen gültigen Port (1–65535) angeben.", success: null }
  }
  if (fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail)) {
    return { error: "Bitte eine gültige Absender-E-Mail angeben.", success: null }
  }

  const patch = {
    host,
    port: Number.isInteger(port) ? port : 587,
    secure,
    username,
    from_email: fromEmail,
    from_name: fromName,
    updated_by: user.id,
    // Only overwrite the stored password when a new one was entered (write-only).
    ...(newPassword ? { password_cipher: encryptSecret(newPassword) } : {}),
  }

  const { error } = await supabase.from("app_smtp_settings").update(patch).eq("id", 1)
  if (error) return { error: error.message, success: null }

  revalidatePath("/admin/smtp")
  return { error: null, success: "SMTP-Einstellungen gespeichert." }
}

export async function sendTestMailAction(_prev: SmtpFormState, formData: FormData): Promise<SmtpFormState> {
  await requireStaff()
  const to = ((formData.get("testTo") as string) || "").trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { error: "Bitte eine gültige Empfänger-E-Mail für den Test angeben.", success: null }
  }
  const result = await sendMail({
    to,
    subject: "Seyfarth Testmail",
    text: "Dies ist eine Testmail aus dem Seyfarth-Backoffice. Wenn Sie diese erhalten, ist der SMTP-Versand korrekt konfiguriert.",
  })
  if (!result.ok) return { error: `Testmail fehlgeschlagen: ${result.error}`, success: null }
  return { error: null, success: `Testmail an ${to} versendet.` }
}
