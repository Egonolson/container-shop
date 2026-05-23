import { NextResponse } from "next/server"
import { clearAdminSessionCookie, requireAdminOrigin } from "@/lib/seyfarth-admin-auth"
export const runtime = "nodejs"
export async function POST(request: Request) { const origin = requireAdminOrigin(request as never); if (!origin.ok) return NextResponse.json({ message: origin.message }, { status: origin.status }); const response = NextResponse.json({ ok: true }); clearAdminSessionCookie(response); return response }
