import { NextRequest, NextResponse } from "next/server"
import { adminAuthErrorResponse, changeOwnAdminPassword, createSeyfarthUserSessionToken, getConfiguredSessionSecret, requireAdminOrigin, requireSeyfarthAdmin, setAdminSessionCookie } from "@/lib/seyfarth-admin-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const origin = requireAdminOrigin(request)
  if (!origin.ok) return adminAuthErrorResponse(origin)
  const auth = await requireSeyfarthAdmin(request)
  if (!auth.ok) return adminAuthErrorResponse(auth)
  const secret = getConfiguredSessionSecret()
  if (!secret.ok) return NextResponse.json({ message: secret.message }, { status: secret.status })
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ message: "Ungültige Anfrage." }, { status: 400 }) }
  try {
    const user = await changeOwnAdminPassword(auth.user.id, {
      currentPassword: typeof body.currentPassword === "string" ? body.currentPassword : "",
      newPassword: typeof body.newPassword === "string" ? body.newPassword : "",
    })
    const response = NextResponse.json({ user })
    setAdminSessionCookie(response, createSeyfarthUserSessionToken({ ...user, passwordHash: "" }, { sessionSecret: secret.sessionSecret }))
    return response
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Passwort konnte nicht geändert werden." }, { status: 422 })
  }
}
