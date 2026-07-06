"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { validateRegistration, type RegistrationInput, type ValidationError } from "@/lib/auth/validate-registration"

export type RegisterFormState = {
  errors: ValidationError[]
  values: Partial<RegistrationInput>
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const input: RegistrationInput = {
    customerKind: (formData.get("customerKind") as RegistrationInput["customerKind"]) || "",
    email: (formData.get("email") as string) ?? "",
    password: (formData.get("password") as string) ?? "",
    firstName: (formData.get("firstName") as string) || undefined,
    lastName: (formData.get("lastName") as string) || undefined,
    companyName: (formData.get("companyName") as string) || undefined,
    vatId: (formData.get("vatId") as string) || undefined,
    phone: (formData.get("phone") as string) || undefined,
  }

  const errors = validateRegistration(input)
  if (errors.length > 0) {
    return { errors, values: input }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        customer_kind: input.customerKind,
        first_name: input.firstName ?? null,
        last_name: input.lastName ?? null,
        company_name: input.companyName ?? null,
      },
    },
  })

  if (error) {
    return { errors: [{ field: "form", message: error.message }], values: input }
  }

  // vat_id/phone are not part of the signup trigger insert — persist them as
  // a follow-up profile update now that the session exists (auto-confirmed
  // in local dev; on DEV/PROD this only runs once email confirmation is on).
  if (data.user && (input.vatId || input.phone)) {
    await supabase
      .from("customer_profiles")
      .update({ vat_id: input.vatId || null, phone: input.phone || null })
      .eq("id", data.user.id)
  }

  redirect("/konto")
}
