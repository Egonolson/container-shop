import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const MAX_FILE_BYTES = 10 * 1024 * 1024
const WINDOW_MS = 15 * 60 * 1000
const MAX_UPLOADS_PER_WINDOW = 10
const uploadBuckets = new Map<string, { count: number; resetAt: number }>()

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
}

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status })
}

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  return forwardedFor || realIp || "unknown"
}

function rateLimited(request: NextRequest) {
  const now = Date.now()
  const key = getClientKey(request)
  const bucket = uploadBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    uploadBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > MAX_UPLOADS_PER_WINDOW
}

// Lets a guest (no customer account) attach a placement photo before they
// have any session to key Storage RLS on. Uploads land under a random,
// unguessable "guest/<uuid>.<ext>" path via the service role — nothing is
// granted to the anon key, and the bucket stays private (see
// 20260707160000_placement_photos_storage.sql). Staff can already read every
// object in the bucket via the existing "staff read all placement photos"
// policy, so no migration is needed for this to show up in the backoffice.
export async function POST(request: NextRequest) {
  if (rateLimited(request)) {
    return json("Zu viele Uploads. Bitte versuchen Sie es später erneut.", 429)
  }

  const contentType = request.headers.get("content-type") || ""
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return json("Ungültiger Inhaltstyp.", 415)
  }

  let file: File | null = null
  try {
    const formData = await request.formData()
    const candidate = formData.get("file")
    if (candidate instanceof File) file = candidate
  } catch {
    return json("Ungültige Anfrage.", 400)
  }

  if (!file) return json("Bitte wählen Sie eine Bilddatei aus.", 422)
  if (!file.type.startsWith("image/")) return json("Bitte laden Sie eine Bilddatei hoch.", 422)
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) return json("Das Bild darf höchstens 10 MB groß sein.", 413)

  const extension = EXTENSION_BY_MIME[file.type] || file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  const path = `guest/${crypto.randomUUID()}.${extension}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await createAdminClient()
    .storage.from("placement-photos")
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return json("Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.", 503)
  }

  return NextResponse.json({ path })
}
