import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Server-only Supabase client using the service role key. NEVER import this
// into a client component — the service key must not reach the browser. Used
// for privileged reads/writes that bypass RLS (e.g. loading SMTP settings
// from the guest inquiry path to send a notification email).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_KEY / NEXT_PUBLIC_SUPABASE_URL not configured")
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Untyped service-role client for generic, dynamic-table access (the ERP sync
// engine upserts into a table chosen at runtime). Same privileges as
// createAdminClient — server-only.
export function createRawAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_KEY / NEXT_PUBLIC_SUPABASE_URL not configured")
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
