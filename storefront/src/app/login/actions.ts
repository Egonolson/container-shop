"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type LoginFormState = {
  error: string | null
  email: string
}

export async function loginAction(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = (formData.get("email") as string) ?? ""
  const password = (formData.get("password") as string) ?? ""
  const next = (formData.get("next") as string) || "/konto"

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort angeben.", email }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "E-Mail oder Passwort ist falsch.", email }
  }

  redirect(next)
}
