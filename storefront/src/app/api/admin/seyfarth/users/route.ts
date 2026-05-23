import { NextRequest, NextResponse } from "next/server"
import { addAdminUser, adminAuthErrorResponse, listSafeAdminUsers, requireAdminOrigin, requireSeyfarthRole } from "@/lib/seyfarth-admin-auth"
export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const auth = await requireSeyfarthRole(request, "users:manage")
  if (!auth.ok) return adminAuthErrorResponse(auth)
  return NextResponse.json({ users: await listSafeAdminUsers() })
}

export async function POST(request: NextRequest) {
  const origin = requireAdminOrigin(request)
  if (!origin.ok) return adminAuthErrorResponse(origin)
  const auth = await requireSeyfarthRole(request, "users:manage")
  if (!auth.ok) return adminAuthErrorResponse(auth)
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ message: "Ungültige Anfrage." }, { status: 400 }) }
  try {
    const user = await addAdminUser({
      email: typeof body.email === "string" ? body.email : "",
      name: typeof body.name === "string" ? body.name : "",
      role: body.role === "admin" || body.role === "orders" ? body.role : "orders",
      password: typeof body.password === "string" ? body.password : "",
      mustChangePassword: typeof body.mustChangePassword === "boolean" ? body.mustChangePassword : false,
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Admin-Benutzer konnte nicht angelegt werden." }, { status: 422 })
  }
}
