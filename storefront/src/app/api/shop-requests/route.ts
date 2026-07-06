import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/lib/supabase/types"
import { REQUEST_FORM_VERSION, containerSizes, materialItems, wasteItems, type ShopMode } from "@/lib/seyfarth-shop-data"

export const runtime = "nodejs"

const MAX_TEXT_LENGTH = 2000
const MAX_BODY_BYTES = 128 * 1024
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const POSTAL_CODE_RE = /^\d{5}$/
const PHONE_RE = /^[+\d][\d\s().\/-]{5,31}$/
const ALLOWED_MODES: ShopMode[] = ["entsorgung", "baustoffe", "transport"]
const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS_PER_WINDOW = 10
const requestBuckets = new Map<string, { count: number; resetAt: number }>()

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status })
}

function getClientKey(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  return forwardedFor || realIp || "unknown"
}

function rateLimit(request: NextRequest) {
  const now = Date.now()
  const key = getClientKey(request)
  const bucket = requestBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    requestBuckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > MAX_REQUESTS_PER_WINDOW
}

function cleanString(value: unknown, max = 240) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function getObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function getBoolean(value: unknown) {
  return value === true
}

function parsePositiveNumber(value: unknown, max = 1000) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > max) return null
  return Number(value.toFixed(3))
}

function parseDate(value: unknown) {
  const raw = cleanString(value, 32)
  if (!raw) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return ""
  const date = new Date(`${raw}T00:00:00.000Z`)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const max = new Date(today)
  max.setUTCFullYear(max.getUTCFullYear() + 1)
  if (Number.isNaN(date.getTime()) || date < today || date > max) return ""
  return raw
}

function rejectUnexpectedTopLevelKeys(payload: Record<string, unknown>) {
  const allowed = new Set(["requestFormVersion", "mode", "intent", "location", "selection", "containerSize", "quantity", "placement", "dates", "pricing", "contact", "constructionSiteId", "confirmations", "website"])
  return Object.keys(payload).filter((key) => !allowed.has(key))
}

export async function POST(request: NextRequest) {
  if (rateLimit(request)) {
    return json("Zu viele Anfragen. Bitte versuchen Sie es in einigen Minuten erneut oder rufen Sie uns direkt an.", 429)
  }

  const contentType = request.headers.get("content-type") || ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return json("Ungültiger Inhaltstyp.", 415)
  }

  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return json("Die Anfrage ist zu groß.", 413)
  }

  let payload: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid payload")
    payload = parsed as Record<string, unknown>
  } catch {
    return json("Ungültige Anfrage.", 400)
  }

  if (rejectUnexpectedTopLevelKeys(payload).length > 0) {
    return json("Die Anfrage enthält unbekannte Felder.", 422)
  }
  if (cleanString(payload.website, 80)) {
    return json("Die Anfrage konnte nicht verarbeitet werden.", 422)
  }

  const contact = getObject(payload.contact)
  const firstName = cleanString(contact.firstName)
  const lastName = cleanString(contact.lastName)
  const customerType = cleanString(contact.customerType, 16) === "business" ? "business" : "private"
  const company = cleanString(contact.company)
  const email = cleanString(contact.email).toLowerCase()
  const phone = cleanString(contact.phone)
  const street = cleanString(contact.street)
  const postalCode = cleanString(contact.postalCode)
  const city = cleanString(contact.city)
  const message = cleanString(contact.message, MAX_TEXT_LENGTH)

  const mode = typeof payload.mode === "string" ? payload.mode as ShopMode : ""
  if (!ALLOWED_MODES.includes(mode as ShopMode)) {
    return json("Bitte wählen Sie einen Bereich aus.", 422)
  }
  if (!firstName || !lastName || !EMAIL_RE.test(email) || !PHONE_RE.test(phone) || !street || !POSTAL_CODE_RE.test(postalCode) || !city) {
    return json("Bitte füllen Sie alle Pflichtfelder korrekt aus.", 422)
  }
  if (customerType === "business" && !company) {
    return json("Bitte geben Sie einen Firmennamen an.", 422)
  }

  const confirmations = getObject(payload.confirmations)
  if (!getBoolean(confirmations.privacyAccepted)) {
    return json("Bitte bestätigen Sie den Datenschutzhinweis.", 422)
  }
  if (cleanString(confirmations.submittedNoticeVersion, 80) !== REQUEST_FORM_VERSION) {
    return json("Bitte laden Sie das Formular neu und senden Sie die Anfrage erneut.", 422)
  }

  const placement = getObject(payload.placement)
  const placementType = cleanString(placement.type, 24)
  if (!["private", "public", "unknown"].includes(placementType)) {
    return json("Bitte wählen Sie den Stellplatz aus.", 422)
  }
  if (placementType === "public" && !getBoolean(placement.permitAccepted)) {
    return json("Bitte bestätigen Sie den Hinweis zur öffentlichen Stellfläche.", 422)
  }

  // Exact placement pin + optional uploaded photo (see placement-map /
  // placement-photos bucket). Coordinates are bounded to plausible values;
  // the photo path is only trusted to point into the caller's own folder.
  const rawCoords = getObject(placement.coordinates)
  const lat = typeof rawCoords.lat === "number" && rawCoords.lat >= -90 && rawCoords.lat <= 90 ? rawCoords.lat : null
  const lng = typeof rawCoords.lng === "number" && rawCoords.lng >= -180 && rawCoords.lng <= 180 ? rawCoords.lng : null
  const placementCoordinates = lat !== null && lng !== null ? { lat, lng } : null
  const placementPhotoPath = cleanString(placement.photoPath, 200) || null

  const location = getObject(payload.location)
  const locationPostalCode = cleanString(location.postalCode)
  const locationCity = cleanString(location.city)
  if (locationPostalCode && !POSTAL_CODE_RE.test(locationPostalCode)) {
    return json("Bitte prüfen Sie die Postleitzahl des Lieferortes.", 422)
  }

  const selection = getObject(payload.selection)
  let sanitizedSelection: Record<string, unknown>
  if (mode === "entsorgung") {
    const selectedWaste = wasteItems.find((item) => item.id === cleanString(selection.id, 80))
    if (!selectedWaste) return json("Bitte wählen Sie eine Entsorgungsart aus.", 422)
    const containerSize = cleanString(payload.containerSize, 40)
    if (!containerSizes.includes(containerSize) || !selectedWaste.allowedContainerSizes.includes(containerSize)) {
      return json("Bitte wählen Sie eine passende Containergröße aus.", 422)
    }
    if (selectedWaste.isHazardous && !getBoolean(placement.safetyAccepted)) {
      return json("Bitte bestätigen Sie den Sicherheitshinweis für gefährliche Abfälle.", 422)
    }
    sanitizedSelection = {
      id: selectedWaste.id,
      name: selectedWaste.name,
      category: selectedWaste.category,
      avv: selectedWaste.avv,
      containerSize,
      hazardous: Boolean(selectedWaste.isHazardous),
    }
  } else if (mode === "baustoffe") {
    const selectedMaterial = materialItems.find((item) => item.id === cleanString(selection.id, 80))
    const quantity = getObject(payload.quantity)
    const quantityValue = parsePositiveNumber(quantity.value, 200)
    if (!selectedMaterial || quantityValue === null) {
      return json("Bitte wählen Sie Baustoff und Menge aus.", 422)
    }
    sanitizedSelection = {
      id: selectedMaterial.id,
      name: selectedMaterial.name,
      category: selectedMaterial.category,
      specification: selectedMaterial.specification,
      quantity: { value: quantityValue, unit: selectedMaterial.unit },
    }
  } else {
    const description = cleanString(selection.description, 600)
    if (!description) return json("Bitte beschreiben Sie den Transport kurz.", 422)
    sanitizedSelection = { description }
  }

  const dates = getObject(payload.dates)
  const sanitizedDates = {
    deliveryDate: parseDate(dates.deliveryDate),
    pickupDate: parseDate(dates.pickupDate),
    flexibility: cleanString(dates.flexibility, 80),
  }

  const requestId = `SEY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
  const receivedAt = new Date().toISOString()

  const entry = {
    requestId,
    receivedAt,
    source: "seyfarth-shop",
    requestFormVersion: REQUEST_FORM_VERSION,
    mode,
    intent: "inquiry",
    location: {
      postalCode: locationPostalCode || postalCode,
      city: locationCity || city,
      zone: typeof location.zone === "number" ? location.zone : null,
      zoneKnown: getBoolean(location.zoneKnown),
    },
    selection: sanitizedSelection,
    placement: {
      type: placementType,
      permitAccepted: getBoolean(placement.permitAccepted),
      safetyAccepted: getBoolean(placement.safetyAccepted),
      coordinates: placementCoordinates,
      photoPath: placementPhotoPath,
    },
    dates: sanitizedDates,
    contact: { customerType, firstName, lastName, company, email, phone, street, postalCode, city, message },
    confirmations: {
      privacyAccepted: true,
      submittedNoticeVersion: cleanString(confirmations.submittedNoticeVersion, 80),
    },
  }

  // Uses the caller's own session (cookie-bound) so RLS enforces that a
  // request can only ever be attributed to the signed-in user themselves —
  // never to an arbitrary customer_id. Guests (no session) get null.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only a logged-in customer can attach a construction site; RLS additionally
  // rejects a site the caller doesn't own (see construction_sites migration).
  const rawSiteId = cleanString(payload.constructionSiteId, 64)
  const constructionSiteId = user && rawSiteId ? rawSiteId : null

  const { error: insertError } = await supabase.from("shop_requests").insert({
    reference: requestId,
    customer_id: user?.id ?? null,
    construction_site_id: constructionSiteId,
    mode,
    request_form_version: REQUEST_FORM_VERSION,
    payload: entry as unknown as Json,
  })
  if (insertError) {
    return json("Die Anfrage konnte technisch nicht gespeichert werden. Bitte rufen Sie uns an oder versuchen Sie es später erneut.", 503)
  }

  // Best-effort notifications — never fail the request if mail is down or the
  // SMTP settings aren't configured yet. Notify Seyfarth and confirm to the
  // customer using the admin-managed SMTP settings.
  const modeLabel = mode === "entsorgung" ? "Entsorgung" : mode === "baustoffe" ? "Baustoffe" : "Transport"
  const operator = cleanString(process.env.OPERATOR_EMAIL, 200)
  const summary = `Referenz: ${requestId}\nBereich: ${modeLabel}\nOrt: ${entry.location.postalCode} ${entry.location.city}\nKunde: ${firstName} ${lastName}${company ? ` (${company})` : ""}\nE-Mail: ${email}\nTelefon: ${phone}\nAdresse: ${street}, ${postalCode} ${city}`
  void (async () => {
    try {
      const { sendMail } = await import("@/lib/email")
      if (operator) {
        await sendMail({ to: operator, subject: `Neue Anfrage ${requestId} (${modeLabel})`, text: `Es ist eine neue Anfrage über den Onlineshop eingegangen.\n\n${summary}${message ? `\n\nNachricht:\n${message}` : ""}` })
      }
      await sendMail({ to: email, subject: `Ihre Anfrage bei Seyfarth (${requestId})`, text: `Vielen Dank für Ihre Anfrage. Wir prüfen Ihre Angaben persönlich und melden uns zur Bestätigung von Preis, Termin und Verfügbarkeit.\n\n${summary}\n\nMit dem Absenden entstehen keine Kosten.\n\nContainerdienst Seyfarth` })
    } catch {
      // swallow — notifications are non-critical
    }
  })()

  return NextResponse.json({
    requestId,
    status: "received",
    mode,
    intent: "inquiry",
    zoneKnown: getBoolean(location.zoneKnown),
    message: message ? "Nachricht wurde aufgenommen." : "Anfrage wurde aufgenommen.",
  })
}
