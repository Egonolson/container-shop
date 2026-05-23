import { NextRequest, NextResponse } from "next/server"
import { adminAuthErrorResponse, requireSeyfarthRole } from "@/lib/seyfarth-admin-auth"
import { listShopRequests, toCsv } from "@/lib/seyfarth-request-store"
export const runtime = "nodejs"
export async function GET(request: NextRequest) {
  const auth = await requireSeyfarthRole(request, request.nextUrl.searchParams.get("format") === "csv" ? "csv:export" : "orders:read")
  if (!auth.ok) return adminAuthErrorResponse(auth)
  const rows = await listShopRequests()
  if (request.nextUrl.searchParams.get("format") === "csv") {
    return new NextResponse(toCsv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="seyfarth-anfragen.csv"' } })
  }
  return NextResponse.json({ requests: rows })
}
