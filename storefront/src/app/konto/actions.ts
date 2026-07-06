"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

export type UpdateProfileState = { error: string | null; success: boolean }

export async function updateProfileAction(
  _prevState: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const patch = {
    first_name: (formData.get("firstName") as string) || null,
    last_name: (formData.get("lastName") as string) || null,
    company_name: (formData.get("companyName") as string) || null,
    vat_id: (formData.get("vatId") as string) || null,
    phone: (formData.get("phone") as string) || null,
    street: (formData.get("street") as string) || null,
    house_number: (formData.get("houseNumber") as string) || null,
    postal_code: (formData.get("postalCode") as string) || null,
    city: (formData.get("city") as string) || null,
  }

  const { error } = await supabase.from("customer_profiles").update(patch).eq("id", user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/konto")
  return { error: null, success: true }
}
