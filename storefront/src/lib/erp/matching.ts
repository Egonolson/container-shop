import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// Bestandskunden-Matching (release plan F2): score a verified portal account
// against the mirrored ERP customers on the four agreed fields — email,
// first/last name (or company), normalized address, USt-ID. Auto-link ONLY on
// an exact, unique verified-email hit; every other case goes to the manual
// review queue (customer_erp_links.status = 'pending') with candidates. Runs
// against the mirror, so it already works with the mock data.

const norm = (s: string | null | undefined) => (s ?? "").trim().toLowerCase()

type ErpRow = {
  external_id: string
  customer_kind: string | null
  company_name: string | null
  first_name: string | null
  last_name: string | null
  emails: string[] | null
  vat_id: string | null
  postal_code: string | null
  city: string | null
  status: string | null
}

type Profile = {
  customer_kind: string
  company_name: string | null
  first_name: string | null
  last_name: string | null
  vat_id: string | null
  postal_code: string | null
}

function score(profile: Profile, email: string, erp: ErpRow) {
  const fields: string[] = []
  let s = 0
  if (erp.emails?.some((e) => norm(e) === norm(email))) {
    s += 0.5
    fields.push("email")
  }
  if (profile.vat_id && erp.vat_id && norm(profile.vat_id) === norm(erp.vat_id)) {
    s += 0.3
    fields.push("vat_id")
  }
  if (profile.customer_kind === "business") {
    if (profile.company_name && erp.company_name && norm(profile.company_name) === norm(erp.company_name)) {
      s += 0.15
      fields.push("company")
    }
  } else if (
    profile.first_name && profile.last_name && erp.first_name && erp.last_name &&
    norm(profile.first_name) === norm(erp.first_name) && norm(profile.last_name) === norm(erp.last_name)
  ) {
    s += 0.15
    fields.push("name")
  }
  if (profile.postal_code && erp.postal_code && profile.postal_code.trim() === erp.postal_code.trim()) {
    s += 0.05
    fields.push("postal_code")
  }
  return { score: Number(s.toFixed(2)), fields }
}

export type MatchOutcome = { status: "auto" | "pending" | "none"; erpCustomerId: string | null; score: number }

// Matches one customer and records the result in customer_erp_links.
export async function matchCustomer(customerId: string): Promise<MatchOutcome> {
  const supabase = createAdminClient()

  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase.from("customer_profiles").select("customer_kind, company_name, first_name, last_name, vat_id, postal_code").eq("id", customerId).single(),
    supabase.auth.admin.getUserById(customerId),
  ])
  const email = userData.user?.email ?? ""
  if (!profile || !email) return { status: "none", erpCustomerId: null, score: 0 }

  const { data: erpRows } = await supabase
    .from("erp_customers")
    .select("external_id, customer_kind, company_name, first_name, last_name, emails, vat_id, postal_code, city, status")
    .eq("is_deleted", false)
    .neq("status", "geloescht")

  const scored = (erpRows ?? [])
    .map((erp) => ({ erp, ...score(profile as Profile, email, erp as ErpRow) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)

  // Auto-link only on an exact, unique verified-email match.
  const emailHits = scored.filter((c) => c.fields.includes("email") && (c.erp.status ?? "aktiv") !== "gesperrt")
  const autoLink = emailHits.length === 1 ? emailHits[0] : null

  const record = {
    customer_id: customerId,
    erp_customer_id: autoLink ? autoLink.erp.external_id : null,
    status: autoLink ? "auto" : scored.length > 0 ? "pending" : "pending",
    score: scored[0]?.score ?? 0,
    matched_fields: (autoLink?.fields ?? scored[0]?.fields ?? []) as unknown as never,
    candidates: scored.slice(0, 5).map((c) => ({ erp_customer_id: c.erp.external_id, score: c.score, fields: c.fields })) as unknown as never,
    decided_at: autoLink ? new Date().toISOString() : null,
  }
  await supabase.from("customer_erp_links").upsert(record, { onConflict: "customer_id" })

  return { status: autoLink ? "auto" : "pending", erpCustomerId: autoLink?.erp.external_id ?? null, score: record.score }
}

// Re-matches all portal customers that have no confirmed link yet — the
// retro-matching run for accounts created before the ERP mirror existed.
export async function rematchUnlinkedCustomers(): Promise<{ matched: number; auto: number }> {
  const supabase = createAdminClient()
  const { data: profiles } = await supabase.from("customer_profiles").select("id")
  const { data: links } = await supabase.from("customer_erp_links").select("customer_id, status")
  const confirmed = new Set((links ?? []).filter((l) => l.status === "confirmed" || l.status === "auto").map((l) => l.customer_id))
  let matched = 0
  let auto = 0
  for (const p of profiles ?? []) {
    if (confirmed.has(p.id)) continue
    const outcome = await matchCustomer(p.id)
    matched += 1
    if (outcome.status === "auto") auto += 1
  }
  return { matched, auto }
}
