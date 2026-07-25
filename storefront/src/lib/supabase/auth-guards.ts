import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return { supabase, user }
}

export async function requireStaff() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "staff" && profile.role !== "admin")) {
    redirect("/admin/login")
  }

  return { supabase, user, profile }
}

// Stricter than requireStaff: only the "admin" role may manage other
// backoffice accounts (invite, role change, revoke). "staff" is intentionally
// excluded to keep account management least-privilege.
export async function requireAdmin() {
  const { supabase, user, profile } = await requireStaff()

  if (profile.role !== "admin") {
    redirect("/admin")
  }

  return { supabase, user, profile }
}
