import { NextRequest, NextResponse } from "next/server"
import { adminAuthErrorResponse, requireAdminOrigin, requireSeyfarthRole } from "@/lib/seyfarth-admin-auth"
import { updateShopRequestStatus } from "@/lib/seyfarth-request-store"
export const runtime = "nodejs"
type RouteContext = { params: Promise<{ requestId: string }> | { requestId: string } }
export async function PATCH(request: NextRequest, context: RouteContext) {
  const origin = requireAdminOrigin(request)
  if (!origin.ok) return adminAuthErrorResponse(origin)
  const auth = await requireSeyfarthRole(request, "orders:update")
  if (!auth.ok) return adminAuthErrorResponse(auth)
  const params = await context.params
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ message: "Ungültige Anfrage." }, { status: 400 }) }
  try {
    const updated = await updateShopRequestStatus({}, params.requestId, { status: typeof body.status === "string" ? body.status : "", internalNote: typeof body.internalNote === "string" ? body.internalNote : "" })
    return NextResponse.json({ request: updated })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Status konnte nicht gespeichert werden." }, { status: 422 })
  }
}
