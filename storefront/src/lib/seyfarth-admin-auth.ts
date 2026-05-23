import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { NextRequest, NextResponse } from "next/server"

export const ADMIN_COOKIE_NAME = "seyfarth_admin_session"
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_LOGIN_ATTEMPTS = 8
const SCRYPT_KEY_LENGTH = 64
const loginBuckets = new Map<string, { count: number; resetAt: number }>()

export type SeyfarthAdminRole = "admin" | "orders"
export type SeyfarthPermission = "orders:read" | "orders:update" | "csv:export" | "smtp:read" | "smtp:update" | "users:manage"
export type SeyfarthAdminUser = {
  id: string
  email: string
  name: string
  role: SeyfarthAdminRole
  active: boolean
  passwordHash: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  passwordChangedAt?: string
  mustChangePassword?: boolean
}
export type SafeSeyfarthAdminUser = {
  id: string
  email: string
  name: string
  role: SeyfarthAdminRole
  active: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  passwordChangedAt?: string
  mustChangePassword?: boolean
}

type UserSessionConfig = { sessionSecret?: string; now?: number; usersPath?: string }
const ROLE_PERMISSIONS: Record<SeyfarthPermission, SeyfarthAdminRole[]> = {
  "orders:read": ["admin", "orders"],
  "orders:update": ["admin", "orders"],
  "csv:export": ["admin"],
  "smtp:read": ["admin"],
  "smtp:update": ["admin"],
  "users:manage": ["admin"],
}

function sign(payload: string, sessionSecret: string) {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url")
}
function requireSessionSecret(config: UserSessionConfig = {}): { ok: true; sessionSecret: string } | { ok: false; status: number; message: string } {
  const sessionSecret = config.sessionSecret ?? process.env.SEYFARTH_ADMIN_SESSION_SECRET ?? ""
  if (sessionSecret.length < 32) return { ok: false, status: 503, message: "Admin-Sitzungen sind noch nicht sicher konfiguriert." }
  return { ok: true, sessionSecret }
}
function normalizeEmail(email: string) { return email.trim().toLowerCase() }
function assertRole(role: unknown): SeyfarthAdminRole {
  if (role === "admin" || role === "orders") return role
  throw new Error("Ungültige Admin-Rolle.")
}
export function getAdminUsersPath() { return process.env.SEYFARTH_ADMIN_USERS_PATH || join(process.cwd(), "data", "seyfarth-admin-users.json") }
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function isAdminLoginRateLimited(request: NextRequest) {
  const key = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown"
  const now = Date.now()
  const bucket = loginBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    loginBuckets.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return false
  }
  bucket.count += 1
  return bucket.count > MAX_LOGIN_ATTEMPTS
}

export function requireAdminOrigin(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (!origin) return { ok: false as const, status: 403, message: "Ungültiger Ursprung der Anfrage." }
  try {
    const originUrl = new URL(origin)
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || ""
    const proto = request.headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "")
    if (originUrl.host === host && originUrl.protocol.replace(":", "") === proto) return { ok: true as const }
  } catch {}
  return { ok: false as const, status: 403, message: "Ungültiger Ursprung der Anfrage." }
}

export async function hashAdminPassword(password: string) {
  if (password.length < 12) throw new Error("Passwort muss mindestens 12 Zeichen haben.")
  const salt = randomBytes(16).toString("base64url")
  const hash = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url")
  return `scrypt$${salt}$${hash}`
}
export async function verifyAdminPassword(password: string, storedHash: string) {
  const [scheme, salt, hash] = storedHash.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const candidate = scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString("base64url")
  return safeEqual(candidate, hash)
}
export function sanitizeAdminUser(user: SeyfarthAdminUser): SafeSeyfarthAdminUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    passwordChangedAt: user.passwordChangedAt,
    mustChangePassword: user.mustChangePassword === true,
  }
}
export function canSeyfarthRole(role: SeyfarthAdminRole, permission: SeyfarthPermission) {
  return ROLE_PERMISSIONS[permission]?.includes(role) || false
}
export async function readAdminUsers(filePath = getAdminUsersPath()): Promise<SeyfarthAdminUser[]> {
  try {
    const raw = await readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error("Admin-Benutzerspeicher ist beschädigt.")
    return parsed.map((entry) => {
      const row = entry as Partial<SeyfarthAdminUser>
      if (!row.id || !row.email || !row.passwordHash) throw new Error("Admin-Benutzerspeicher ist unvollständig.")
      return { ...row, email: normalizeEmail(row.email), name: String(row.name || row.email), role: assertRole(row.role), active: row.active !== false, createdAt: String(row.createdAt || new Date(0).toISOString()), updatedAt: String(row.updatedAt || new Date(0).toISOString()), passwordHash: String(row.passwordHash), id: String(row.id), mustChangePassword: row.mustChangePassword === true } as SeyfarthAdminUser
    })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return []
    throw error
  }
}
export async function writeAdminUsers(filePath: string, users: SeyfarthAdminUser[]) {
  const normalized = users.map((user) => ({ ...user, email: normalizeEmail(user.email) }))
  const seen = new Set<string>()
  for (const user of normalized) {
    if (seen.has(user.email)) throw new Error("E-Mail-Adresse ist bereits vergeben.")
    seen.add(user.email)
  }
  if (normalized.length > 0 && !normalized.some((user) => user.active && user.role === "admin")) throw new Error("Mindestens ein aktiver Admin-Benutzer muss verbleiben.")
  await mkdir(dirname(filePath), { recursive: true })
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  await writeFile(tmp, JSON.stringify(normalized, null, 2), { encoding: "utf8", mode: 0o600 })
  await rename(tmp, filePath)
}
export async function createAdminUserRecord(input: { email: string; name?: string; role: SeyfarthAdminRole; password: string; active?: boolean; mustChangePassword?: boolean }) {
  const now = new Date().toISOString()
  return { id: randomUUID(), email: normalizeEmail(input.email), name: String(input.name || input.email).trim(), role: assertRole(input.role), active: input.active !== false, passwordHash: await hashAdminPassword(input.password), createdAt: now, updatedAt: now, passwordChangedAt: now, mustChangePassword: input.mustChangePassword === true } satisfies SeyfarthAdminUser
}
export async function listSafeAdminUsers(path = getAdminUsersPath()) { return (await readAdminUsers(path)).map(sanitizeAdminUser) }
export async function findAdminUserByEmail(email: string, path = getAdminUsersPath()) { return (await readAdminUsers(path)).find((user) => user.email === normalizeEmail(email)) || null }
export async function addAdminUser(input: { email: string; name?: string; role: SeyfarthAdminRole; password: string; mustChangePassword?: boolean }, path = getAdminUsersPath()) {
  const users = await readAdminUsers(path)
  const user = await createAdminUserRecord(input)
  await writeAdminUsers(path, [...users, user])
  return sanitizeAdminUser(user)
}
export async function updateAdminUser(userId: string, input: { name?: string; role?: SeyfarthAdminRole; active?: boolean; password?: string; mustChangePassword?: boolean }, path = getAdminUsersPath()) {
  const users = await readAdminUsers(path)
  const index = users.findIndex((user) => user.id === userId)
  if (index < 0) throw new Error("Admin-Benutzer wurde nicht gefunden.")
  const now = new Date().toISOString()
  const current = users[index]
  const next: SeyfarthAdminUser = { ...current, updatedAt: now }
  if (typeof input.name === "string") next.name = input.name.trim() || current.email
  if (input.role) next.role = assertRole(input.role)
  if (typeof input.active === "boolean") next.active = input.active
  if (typeof input.mustChangePassword === "boolean") next.mustChangePassword = input.mustChangePassword
  if (typeof input.password === "string" && input.password.length > 0) { next.passwordHash = await hashAdminPassword(input.password); next.passwordChangedAt = now }
  users[index] = next
  await writeAdminUsers(path, users)
  return sanitizeAdminUser(next)
}

export async function changeOwnAdminPassword(userId: string, input: { currentPassword: string; newPassword: string }, path = getAdminUsersPath()) {
  const users = await readAdminUsers(path)
  const user = users.find((row) => row.id === userId) || null
  if (!user || !user.active) throw new Error("Admin-Benutzer wurde nicht gefunden.")
  if (!(await verifyAdminPassword(input.currentPassword, user.passwordHash))) throw new Error("Aktuelles Passwort ist nicht korrekt.")
  if (input.currentPassword === input.newPassword) throw new Error("Das neue Passwort muss sich vom temporären Passwort unterscheiden.")
  return updateAdminUser(userId, { password: input.newPassword, mustChangePassword: false }, path)
}

export async function ensureBootstrapAdminUser(path = getAdminUsersPath()) {
  const users = await readAdminUsers(path)
  if (users.length > 0) return users
  const email = normalizeEmail(process.env.SEYFARTH_BOOTSTRAP_ADMIN_EMAIL || "")
  const password = process.env.SEYFARTH_BOOTSTRAP_ADMIN_PASSWORD || ""
  if (!email || password.length < 12) return users
  const user = await createAdminUserRecord({ email, name: "Seyfarth Admin", role: "admin", password, mustChangePassword: true })
  await writeAdminUsers(path, [user])
  return [user]
}
export async function authenticateAdminUser(email: string, password: string) {
  const users = await ensureBootstrapAdminUser()
  const user = users.find((row) => row.email === normalizeEmail(email)) || null
  if (!user || !user.active) return null
  if (!(await verifyAdminPassword(password, user.passwordHash))) return null
  return user
}
export function createSeyfarthUserSessionToken(user: SeyfarthAdminUser, config: Required<Pick<UserSessionConfig, "sessionSecret">> & { now?: number }) {
  const now = config.now ?? Date.now()
  const expiresAt = now + SESSION_TTL_MS
  const payload = JSON.stringify({ v: 2, exp: expiresAt, uid: user.id, pc: user.passwordChangedAt || user.updatedAt })
  const encodedPayload = Buffer.from(payload).toString("base64url")
  return `${encodedPayload}.${sign(encodedPayload, config.sessionSecret)}`
}
export async function verifySeyfarthUserSessionToken(token: string | undefined | null, config: UserSessionConfig = {}) {
  const secret = requireSessionSecret(config)
  if (secret.ok === false) return { ok: false as const, status: secret.status, message: secret.message }
  if (!token || !token.includes(".")) return { ok: false as const, status: 401, message: "Nicht angemeldet." }
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload, secret.sessionSecret))) return { ok: false as const, status: 401, message: "Sitzung ist ungültig." }
  try {
    const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number; uid?: string; pc?: string }
    if (!parsed.exp || parsed.exp < (config.now ?? Date.now())) return { ok: false as const, status: 401, message: "Sitzung ist abgelaufen." }
    const user = (await readAdminUsers(config.usersPath)).find((row) => row.id === parsed.uid) || null
    if (!user || !user.active) return { ok: false as const, status: 401, message: "Sitzung ist ungültig." }
    if ((user.passwordChangedAt || user.updatedAt) !== parsed.pc) return { ok: false as const, status: 401, message: "Sitzung ist ungültig." }
    return { ok: true as const, user: sanitizeAdminUser(user), expiresAt: parsed.exp }
  } catch { return { ok: false as const, status: 401, message: "Sitzung ist ungültig." } }
}
export async function requireSeyfarthAdmin(request: NextRequest) { return verifySeyfarthUserSessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value) }
export async function requireSeyfarthRole(request: NextRequest, permission: SeyfarthPermission) {
  const auth = await requireSeyfarthAdmin(request)
  if (!auth.ok) return auth
  if (auth.user.mustChangePassword) return { ok: false as const, status: 403, message: "Bitte ändern Sie zuerst Ihr temporäres Passwort." }
  if (!canSeyfarthRole(auth.user.role, permission)) return { ok: false as const, status: 403, message: "Für diese Aktion fehlt die Berechtigung." }
  return auth
}
export function adminAuthErrorResponse(result: { status?: number; message?: string }) { return NextResponse.json({ message: result.message || "Nicht berechtigt." }, { status: result.status || 401 }) }
export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: SESSION_TTL_MS / 1000 })
}
export function clearAdminSessionCookie(response: NextResponse) { response.cookies.set(ADMIN_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 }) }
export function getConfiguredSessionSecret() {
  const secret = requireSessionSecret()
  if (!secret.ok) return secret
  return secret
}
