import { appendFile, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { NextRequest, NextResponse } from "next/server"
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
  const allowed = new Set(["requestFormVersion", "mode", "intent", "location", "selection", "containerSize", "quantity", "placement", "dates", "pricing", "contact", "confirmations", "website"])
  return Object.keys(payload).filter((key) => !allowed.has(key))
}

async function persistRequest(entry: Record<string, unknown>) {
  const filePath = process.env.SEYFARTH_REQUEST_LOG_PATH || "/tmp/seyfarth-shop-requests.jsonl"
  await mkdir(dirname(filePath), { recursive: true })
  await appendFile(filePath, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 })
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
  const name = cleanString(contact.name)
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
  if (!name || !EMAIL_RE.test(email) || !PHONE_RE.test(phone) || !street || !POSTAL_CODE_RE.test(postalCode) || !city) {
    return json("Bitte füllen Sie alle Pflichtfelder korrekt aus.", 422)
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
    status: "received",
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
    },
    dates: sanitizedDates,
    contact: { name, company, email, phone, street, postalCode, city, message },
    confirmations: {
      privacyAccepted: true,
      submittedNoticeVersion: cleanString(confirmations.submittedNoticeVersion, 80),
    },
  }

  try {
    await persistRequest(entry)
  } catch {
    return json("Die Anfrage konnte technisch nicht gespeichert werden. Bitte rufen Sie uns an oder versuchen Sie es später erneut.", 503)
  }

  return NextResponse.json({
    requestId,
    status: "received",
    mode,
    intent: "inquiry",
    zoneKnown: getBoolean(location.zoneKnown),
    message: message ? "Nachricht wurde aufgenommen." : "Anfrage wurde aufgenommen.",
  })
}
