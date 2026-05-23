import { NextRequest, NextResponse } from "next/server"
import { adminAuthErrorResponse, requireAdminOrigin, requireSeyfarthRole, updateAdminUser } from "@/lib/seyfarth-admin-auth"
export const runtime = "nodejs"
type RouteContext = { params: Promise<{ userId: string }> | { userId: string } }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const origin = requireAdminOrigin(request)
  if (!origin.ok) return adminAuthErrorResponse(origin)
  const auth = await requireSeyfarthRole(request, "users:manage")
  if (!auth.ok) return adminAuthErrorResponse(auth)
  const params = await context.params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ message: "Ungültige Anfrage." }, { status: 400 }) }
  try {
    const user = await updateAdminUser(params.userId, {
      name: typeof body.name === "string" ? body.name : undefined,
      role: body.role === "orders" || body.role === "admin" ? body.role : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      password: typeof body.password === "string" ? body.password : undefined,
      mustChangePassword: typeof body.mustChangePassword === "boolean" ? body.mustChangePassword : undefined,
    })
    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Admin-Benutzer konnte nicht gespeichert werden." }, { status: 422 })
  }
}
