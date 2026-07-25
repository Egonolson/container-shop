"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/supabase/auth-guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail } from "@/lib/email"

export type UserActionState = { error: string | null; success: string | null; generatedPassword?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generatePassword(): string {
  return randomBytes(18).toString("base64url")
}

// Refuses to leave the backoffice with zero admin accounts — the last admin
// can neither be demoted nor have access revoked.
async function assertNotLastAdmin(admin: ReturnType<typeof createAdminClient>, targetId: string, targetCurrentRole: string) {
  if (targetCurrentRole !== "admin") return null
  const { count } = await admin.from("customer_profiles").select("*", { count: "exact", head: true }).eq("role", "admin")
  if ((count ?? 0) <= 1) return "Es muss mindestens ein Admin-Konto bestehen bleiben."
  return null
}

export async function inviteStaffAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  await requireAdmin()

  const email = ((formData.get("email") as string) || "").trim().toLowerCase()
  const firstName = ((formData.get("firstName") as string) || "").trim()
  const lastName = ((formData.get("lastName") as string) || "").trim()
  const role = (formData.get("role") as string) || "staff"

  if (!EMAIL_RE.test(email)) return { error: "Bitte eine gültige E-Mail-Adresse angeben.", success: null }
  if (role !== "staff" && role !== "admin") return { error: "Ungültige Rolle.", success: null }

  const admin = createAdminClient()
  const password = generatePassword()

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName || undefined, last_name: lastName || undefined },
  })
  if (createError || !created.user) {
    const message = createError?.message.includes("already been registered")
      ? "Diese E-Mail-Adresse ist bereits registriert."
      : createError?.message ?? "Konto konnte nicht angelegt werden."
    return { error: message, success: null }
  }

  // The on_auth_user_created trigger already created a default customer_profiles
  // row (role "customer") — promote it and fill in the name.
  const { error: profileError } = await admin
    .from("customer_profiles")
    .update({ role, first_name: firstName || null, last_name: lastName || null })
    .eq("id", created.user.id)
  if (profileError) return { error: profileError.message, success: null }

  const mailResult = await sendMail({
    to: email,
    subject: "Ihr Zugang zum Seyfarth-Backoffice",
    text: `Guten Tag,\n\nfür Sie wurde ein Backoffice-Zugang für die Containerdienst Seyfarth angelegt.\n\nE-Mail: ${email}\nTemporäres Passwort: ${password}\n\nBitte melden Sie sich an und ändern Sie das Passwort zeitnah.\n\nMit freundlichen Grüßen\nContainerdienst Seyfarth`,
  })

  revalidatePath("/admin/benutzer")
  revalidatePath("/admin")

  return {
    error: null,
    success: mailResult.ok
      ? `Konto für ${email} angelegt, Zugangsdaten wurden per E-Mail versendet.`
      : `Konto für ${email} angelegt. E-Mail-Versand fehlgeschlagen (${mailResult.error}) — bitte das Passwort unten manuell weitergeben.`,
    generatedPassword: password,
  }
}

export async function changeRoleAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const { user } = await requireAdmin()

  const id = (formData.get("id") as string) || ""
  const role = (formData.get("role") as string) || ""
  if (role !== "staff" && role !== "admin") return { error: "Ungültige Rolle.", success: null }

  const admin = createAdminClient()
  const { data: target } = await admin.from("customer_profiles").select("role").eq("id", id).single()
  if (!target) return { error: "Konto nicht gefunden.", success: null }

  if (id === user.id && role !== "admin") {
    return { error: "Sie können sich nicht selbst degradieren — lassen Sie das ein zweites Admin-Konto tun.", success: null }
  }

  const lockoutError = await assertNotLastAdmin(admin, id, target.role)
  if (lockoutError && role !== "admin") return { error: lockoutError, success: null }

  const { error } = await admin.from("customer_profiles").update({ role }).eq("id", id)
  if (error) return { error: error.message, success: null }

  revalidatePath("/admin/benutzer")
  return { error: null, success: "Rolle aktualisiert." }
}

export async function revokeAccessAction(_prev: UserActionState, formData: FormData): Promise<UserActionState> {
  const { user } = await requireAdmin()

  const id = (formData.get("id") as string) || ""
  if (id === user.id) return { error: "Sie können sich nicht selbst den Zugriff entziehen.", success: null }

  const admin = createAdminClient()
  const { data: target } = await admin.from("customer_profiles").select("role").eq("id", id).single()
  if (!target) return { error: "Konto nicht gefunden.", success: null }

  const lockoutError = await assertNotLastAdmin(admin, id, target.role)
  if (lockoutError) return { error: lockoutError, success: null }

  const { error } = await admin.from("customer_profiles").update({ role: "customer" }).eq("id", id)
  if (error) return { error: error.message, success: null }

  revalidatePath("/admin/benutzer")
  revalidatePath("/admin")
  return { error: null, success: "Zugriff entzogen — das Konto besteht als normales Kundenkonto fort." }
}
