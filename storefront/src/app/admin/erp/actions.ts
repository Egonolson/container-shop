"use server"

import { revalidatePath } from "next/cache"
import { requireStaff } from "@/lib/supabase/auth-guards"
import { encryptSecret } from "@/lib/crypto"
import { runErpSync } from "@/lib/erp/sync"
import { rematchUnlinkedCustomers } from "@/lib/erp/matching"

export type ErpActionState = { error: string | null; success: string | null }

export async function saveErpConnectionAction(_prev: ErpActionState, formData: FormData): Promise<ErpActionState> {
  const { supabase, user } = await requireStaff()
  const baseUrl = ((formData.get("baseUrl") as string) || "").trim() || null
  const enabled = formData.get("enabled") === "on"
  const newKey = (formData.get("apiKey") as string) || ""

  const patch = {
    base_url: baseUrl,
    enabled,
    updated_by: user.id,
    ...(newKey ? { api_key_cipher: encryptSecret(newKey) } : {}),
  }
  const { error } = await supabase.from("erp_connection").update(patch).eq("id", 1)
  if (error) return { error: error.message, success: null }
  revalidatePath("/admin/erp")
  return { error: null, success: "ERP-Verbindung gespeichert." }
}

export async function runSyncAction(): Promise<ErpActionState> {
  await requireStaff()
  try {
    const results = await runErpSync()
    const total = results.reduce((a, r) => ({ i: a.i + r.inserted, u: a.u + r.updated, d: a.d + r.deleted, e: a.e + r.errors }), { i: 0, u: 0, d: 0, e: 0 })
    revalidatePath("/admin/erp")
    return { error: null, success: `Sync fertig: ${total.i} neu, ${total.u} aktualisiert, ${total.d} entfernt, ${total.e} Fehler.` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sync fehlgeschlagen.", success: null }
  }
}

export async function runMatchAction(): Promise<ErpActionState> {
  await requireStaff()
  try {
    const { matched, auto } = await rematchUnlinkedCustomers()
    revalidatePath("/admin/erp")
    return { error: null, success: `Abgleich fertig: ${matched} geprüft, ${auto} automatisch verknüpft.` }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Abgleich fehlgeschlagen.", success: null }
  }
}

export async function decideMatchAction(formData: FormData) {
  const { supabase, user } = await requireStaff()
  const id = (formData.get("id") as string) || ""
  const decision = (formData.get("decision") as string) || ""
  const erpCustomerId = ((formData.get("erpCustomerId") as string) || "").trim() || null
  if (!id || !["confirmed", "rejected"].includes(decision)) return

  await supabase
    .from("customer_erp_links")
    .update({
      status: decision,
      erp_customer_id: decision === "confirmed" ? erpCustomerId : null,
      decided_at: new Date().toISOString(),
      decided_by: user.id,
    })
    .eq("id", id)
  revalidatePath("/admin/erp")
}
