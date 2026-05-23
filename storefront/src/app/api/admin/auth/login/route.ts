import { NextRequest, NextResponse } from "next/server"
import { adminAuthErrorResponse, authenticateAdminUser, createSeyfarthUserSessionToken, getConfiguredSessionSecret, isAdminLoginRateLimited, requireAdminOrigin, setAdminSessionCookie } from "@/lib/seyfarth-admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const origin = requireAdminOrigin(request)
  if (!origin.ok) return adminAuthErrorResponse(origin)
  if (isAdminLoginRateLimited(request)) return NextResponse.json({ message: "Zu viele Anmeldeversuche. Bitte später erneut versuchen." }, { status: 429 })
  const secret = getConfiguredSessionSecret()
  if (!secret.ok) return NextResponse.json({ message: secret.message }, { status: secret.status })
  let email = ""
  let password = ""
  try {
    const body = await request.json()
    email = typeof body?.email === "string" ? body.email : ""
    password = typeof body?.password === "string" ? body.password : ""
  } catch {
    return NextResponse.json({ message: "Ungültige Anmeldung." }, { status: 400 })
  }
  const user = await authenticateAdminUser(email, password)
  if (!user) return NextResponse.json({ message: "Anmeldung fehlgeschlagen." }, { status: 401 })
  const response = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name, role: user.role, active: user.active, mustChangePassword: user.mustChangePassword === true } })
  setAdminSessionCookie(response, createSeyfarthUserSessionToken(user, { sessionSecret: secret.sessionSecret }))
  return response
}
