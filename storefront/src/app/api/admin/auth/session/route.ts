import { NextRequest, NextResponse } from "next/server"
import { requireSeyfarthAdmin } from "@/lib/seyfarth-admin-auth"
export const runtime = "nodejs"
export async function GET(request: NextRequest) {
  const auth = await requireSeyfarthAdmin(request)
  if (!auth.ok) return NextResponse.json({ authenticated: false, message: auth.message }, { status: auth.status })
  return NextResponse.json({ authenticated: true, expiresAt: auth.expiresAt, user: auth.user })
}
