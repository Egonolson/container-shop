"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AdminLoginFormState = { error: string | null; email: string }

export async function adminLoginAction(
  _prevState: AdminLoginFormState,
  formData: FormData,
): Promise<AdminLoginFormState> {
  const email = (formData.get("email") as string) ?? ""
  const password = (formData.get("password") as string) ?? ""

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort angeben.", email }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: "E-Mail oder Passwort ist falsch.", email }
  }

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("role")
    .eq("id", data.user.id)
    .single()

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    await supabase.auth.signOut()
    return { error: "Dieses Konto hat keinen Zugriff auf das Backoffice.", email }
  }

  redirect("/admin")
}
