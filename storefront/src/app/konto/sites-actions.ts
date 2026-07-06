"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export type SiteActionState = { error: string | null; success: boolean }

const POSTAL_CODE_RE = /^\d{5}$/

function readSiteForm(formData: FormData) {
  const name = ((formData.get("name") as string) || "").trim()
  const postalCode = ((formData.get("postalCode") as string) || "").trim()
  return {
    name,
    postalCode,
    patch: {
      name,
      street: ((formData.get("street") as string) || "").trim() || null,
      house_number: ((formData.get("houseNumber") as string) || "").trim() || null,
      postal_code: postalCode || null,
      city: ((formData.get("city") as string) || "").trim() || null,
      contact_name: ((formData.get("contactName") as string) || "").trim() || null,
      contact_phone: ((formData.get("contactPhone") as string) || "").trim() || null,
      notes: ((formData.get("notes") as string) || "").trim() || null,
    },
  }
}

export async function createSiteAction(
  _prevState: SiteActionState,
  formData: FormData,
): Promise<SiteActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { name, postalCode, patch } = readSiteForm(formData)
  if (!name) return { error: "Bitte geben Sie einen Namen für die Baustelle an.", success: false }
  if (postalCode && !POSTAL_CODE_RE.test(postalCode)) return { error: "Bitte prüfen Sie die Postleitzahl.", success: false }

  const { error } = await supabase.from("construction_sites").insert({ ...patch, customer_id: user.id })
  if (error) return { error: error.message, success: false }

  revalidatePath("/konto")
  return { error: null, success: true }
}

export async function updateSiteAction(
  _prevState: SiteActionState,
  formData: FormData,
): Promise<SiteActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const id = (formData.get("id") as string) || ""
  if (!id) return { error: "Baustelle nicht gefunden.", success: false }
  const { name, postalCode, patch } = readSiteForm(formData)
  if (!name) return { error: "Bitte geben Sie einen Namen für die Baustelle an.", success: false }
  if (postalCode && !POSTAL_CODE_RE.test(postalCode)) return { error: "Bitte prüfen Sie die Postleitzahl.", success: false }

  // RLS also enforces ownership; the explicit customer_id filter is belt-and-suspenders.
  const { error } = await supabase.from("construction_sites").update(patch).eq("id", id).eq("customer_id", user.id)
  if (error) return { error: error.message, success: false }

  revalidatePath("/konto")
  return { error: null, success: true }
}

export async function setSiteArchivedAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const id = (formData.get("id") as string) || ""
  const archived = (formData.get("archived") as string) === "true"
  if (!id) return

  await supabase.from("construction_sites").update({ is_archived: archived }).eq("id", id).eq("customer_id", user.id)
  revalidatePath("/konto")
}
