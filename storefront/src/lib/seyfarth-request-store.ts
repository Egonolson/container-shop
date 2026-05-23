import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

export const REQUEST_STATUSES = ["received", "in_review", "callback_open", "offer_sent", "confirmed", "declined", "cancelled"] as const
export type RequestStatus = typeof REQUEST_STATUSES[number]
export type ShopRequestEntry = Record<string, unknown> & { requestId: string; receivedAt: string; status: RequestStatus | string; mode?: string; intent?: string; contact?: Record<string, unknown>; location?: Record<string, unknown> }
type StatusOverride = { status: RequestStatus; internalNote?: string; updatedAt: string }
export function getRequestLogPath() { return process.env.SEYFARTH_REQUEST_LOG_PATH || join("data", "shop-requests.jsonl") }
export function getRequestStatusPath() { return process.env.SEYFARTH_REQUEST_STATUS_PATH || `${getRequestLogPath()}.status.json` }
export async function appendShopRequest(filePath: string, entry: Record<string, unknown>) { await mkdir(/* turbopackIgnore: true */ dirname(filePath), { recursive: true }); await appendFile(/* turbopackIgnore: true */ filePath, `${JSON.stringify(entry)}\n`, { encoding: "utf8", mode: 0o600 }) }
async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> { try { return JSON.parse(await readFile(/* turbopackIgnore: true */ filePath, "utf8")) as T } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback; throw error } }
async function writeJsonAtomic(filePath: string, value: unknown) { await mkdir(/* turbopackIgnore: true */ dirname(filePath), { recursive: true }); const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`; await writeFile(/* turbopackIgnore: true */ tmp, JSON.stringify(value, null, 2), { encoding: "utf8", mode: 0o600 }); await rename(/* turbopackIgnore: true */ tmp, /* turbopackIgnore: true */ filePath) }
export async function listShopRequests(paths: { logPath?: string; statusPath?: string } = {}) {
  const logPath = paths.logPath || getRequestLogPath(); const statusPath = paths.statusPath || getRequestStatusPath(); let raw = ""
  try { raw = await readFile(/* turbopackIgnore: true */ logPath, "utf8") } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return [] as ShopRequestEntry[]; throw error }
  const overrides = await readJsonFile<Record<string, StatusOverride>>(statusPath, {})
  const rows = raw.split("\n").filter(Boolean).flatMap((line) => { try { const parsed = JSON.parse(line) as ShopRequestEntry; if (!parsed.requestId) return []; const override = overrides[parsed.requestId]; return [{ ...parsed, ...(override || {}) }] } catch { return [] } })
  return rows.sort((a, b) => String(b.receivedAt || "").localeCompare(String(a.receivedAt || "")))
}
export async function getShopRequest(paths: { logPath?: string; statusPath?: string }, requestId: string) { const rows = await listShopRequests(paths); return rows.find((row) => row.requestId === requestId) || null }
export async function updateShopRequestStatus(paths: { logPath?: string; statusPath?: string }, requestId: string, update: { status: string; internalNote?: string }) {
  if (!REQUEST_STATUSES.includes(update.status as RequestStatus)) throw new Error("Ungültiger Anfrage-Status.")
  const existing = await getShopRequest(paths, requestId); if (!existing) throw new Error("Anfrage wurde nicht gefunden.")
  const statusPath = paths.statusPath || getRequestStatusPath(); const overrides = await readJsonFile<Record<string, StatusOverride>>(statusPath, {})
  overrides[requestId] = { status: update.status as RequestStatus, internalNote: String(update.internalNote || "").trim().slice(0, 2000), updatedAt: new Date().toISOString() }
  await writeJsonAtomic(statusPath, overrides); return { ...existing, ...overrides[requestId] }
}
export function toCsv(rows: ShopRequestEntry[]) {
  const headers = ["requestId", "receivedAt", "status", "mode", "intent", "name", "email", "phone", "postalCode", "city", "selection", "internalNote"]
  const neutralize = (raw: string) => /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw
  const escape = (value: unknown) => {
    const raw = neutralize(String(value ?? ""))
    return `"${raw.replaceAll('"', '""')}"`
  }
  const lines = rows.map((row) => { const contact = row.contact || {}; const location = row.location || {}; return [row.requestId, row.receivedAt, row.status, row.mode, row.intent, contact.name, contact.email, contact.phone, location.postalCode, location.city, JSON.stringify(row.selection || {}), row.internalNote].map(escape).join(",") })
  return `${headers.join(",")}\n${lines.join("\n")}\n`
}
