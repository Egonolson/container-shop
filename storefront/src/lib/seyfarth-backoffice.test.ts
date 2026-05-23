import test from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { hashAdminPassword, verifyAdminPassword, createSeyfarthUserSessionToken, verifySeyfarthUserSessionToken, canSeyfarthRole, sanitizeAdminUser, writeAdminUsers, readAdminUsers, createAdminUserRecord, changeOwnAdminPassword, requireAdminOrigin, isAdminLoginRateLimited } from "./seyfarth-admin-auth"
import { appendShopRequest, listShopRequests, updateShopRequestStatus } from "./seyfarth-request-store"
import { normalizeSmtpSettingsForWrite, getSafeSmtpSettings, resolveSmtpPassword } from "./seyfarth-smtp-settings"

test("admin auth requires configured session secret and role permissions", () => {
  assert.equal(canSeyfarthRole("admin", "users:manage"), true)
  assert.equal(canSeyfarthRole("orders", "users:manage"), false)
})



test("admin origin guard rejects missing origin on state-changing requests", () => {
  const request = new Request("https://seyfarth-dev.visionmakegpt.work/api/admin/seyfarth/smtp", {
    method: "PUT",
    headers: { host: "seyfarth-dev.visionmakegpt.work", "x-forwarded-proto": "https" },
  }) as import("next/server").NextRequest
  const result = requireAdminOrigin(request)
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.status, 403)
})

test("login rate limit keys prefer trusted real ip over spoofable forwarded-for", () => {
  const makeRequest = (spoofed: string) => new Request("https://seyfarth-dev.visionmakegpt.work/api/admin/auth/login", {
    method: "POST",
    headers: { "x-forwarded-for": spoofed, "x-real-ip": "203.0.113.10" },
  }) as import("next/server").NextRequest
  for (let i = 0; i < 8; i += 1) assert.equal(isAdminLoginRateLimited(makeRequest(`198.51.100.${i}`)), false)
  assert.equal(isAdminLoginRateLimited(makeRequest("198.51.100.99")), true)
})

test("admin session secret requires at least 32 characters", async () => {
  const dir = await mkdtemp(join(tmpdir(), "seyfarth-admin-short-secret-"))
  const usersPath = join(dir, "admin-users.json")
  const user = await createAdminUserRecord({ email: "admin@seyfarth.test", name: "Admin", role: "admin", password: "sehr-sicheres-passwort" })
  await writeAdminUsers(usersPath, [user])
  const token = createSeyfarthUserSessionToken(user, { sessionSecret: "1234567890123456789012345678901", now: 1_700_000_000_000 })
  const result = await verifySeyfarthUserSessionToken(token, { usersPath, sessionSecret: "1234567890123456789012345678901", now: 1_700_000_100_000 })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.status, 503)
})


test("request store lists JSONL requests and persists status updates separately", async () => {
  const dir = await mkdtemp(join(tmpdir(), "seyfarth-requests-"))
  const logPath = join(dir, "shop-requests.jsonl")
  const statusPath = join(dir, "request-status.json")
  await appendShopRequest(logPath, {
    requestId: "SEY-1",
    receivedAt: "2026-05-13T08:00:00.000Z",
    status: "received",
    intent: "inquiry",
    mode: "entsorgung",
    contact: { name: "Max Mustermann", email: "max@example.test", phone: "+491234567", street: "A 1", postalCode: "04639", city: "Ponitz", message: "" },
    location: { postalCode: "04639", city: "Ponitz", zone: null, zoneKnown: false },
  })
  await updateShopRequestStatus({ logPath, statusPath }, "SEY-1", { status: "in_review", internalNote: "Rückruf läuft" })
  const rows = await listShopRequests({ logPath, statusPath })
  assert.equal(rows.length, 1)
  assert.equal(rows[0].requestId, "SEY-1")
  assert.equal(rows[0].status, "in_review")
  assert.equal(rows[0].internalNote, "Rückruf läuft")
  const statusJson = JSON.parse(await readFile(statusPath, "utf8"))
  assert.equal(statusJson["SEY-1"].status, "in_review")
})

test("SMTP settings store only safe metadata and resolve password through env var", () => {
  const settings = normalizeSmtpSettingsForWrite({
    enabled: true,
    host: " smtp.example.test ",
    port: 587,
    secure: false,
    username: "user@example.test\n",
    passwordEnvVar: "SEYFARTH_SMTP_PASSWORD",
    fromEmail: "shop@example.test",
    toEmail: "info@example.test",
    replyToSender: true,
    subjectPrefix: "Seyfarth",
  })
  assert.equal(settings.host, "smtp.example.test")
  assert.equal(settings.username.includes("\n"), false)
  assert.equal("password" in settings, false)
  const safe = getSafeSmtpSettings(settings, { SEYFARTH_SMTP_PASSWORD: "secret" })
  assert.equal(safe.passwordConfigured, true)
  assert.equal("password" in safe, false)
  assert.equal(resolveSmtpPassword(settings, { SEYFARTH_SMTP_PASSWORD: "secret" }), "secret")
  assert.throws(() => normalizeSmtpSettingsForWrite({ ...settings, passwordEnvVar: "bad-name" }), /Umgebungsvariable/)
})


test("admin users store hashed passwords and never expose password hashes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "seyfarth-admin-users-"))
  const usersPath = join(dir, "admin-users.json")
  const user = await createAdminUserRecord({ email: "chef@seyfarth.test", name: "Chef", role: "admin", password: "sehr-sicheres-passwort" })
  await writeAdminUsers(usersPath, [user])
  const users = await readAdminUsers(usersPath)
  assert.equal(users.length, 1)
  assert.equal(users[0].email, "chef@seyfarth.test")
  assert.notEqual(users[0].passwordHash, "sehr-sicheres-passwort")
  assert.equal(await verifyAdminPassword("sehr-sicheres-passwort", users[0].passwordHash), true)
  assert.equal(await verifyAdminPassword("falsch", users[0].passwordHash), false)
  assert.equal("passwordHash" in sanitizeAdminUser(users[0]), false)
})

test("admin user sessions include identity and reject disabled users", async () => {
  const dir = await mkdtemp(join(tmpdir(), "seyfarth-admin-session-"))
  const usersPath = join(dir, "admin-users.json")
  const user = await createAdminUserRecord({ email: "orders@seyfarth.test", name: "Bestellteam", role: "orders", password: "sehr-sicheres-passwort" })
  const admin = await createAdminUserRecord({ email: "admin@seyfarth.test", name: "Admin", role: "admin", password: "sehr-sicheres-passwort" })
  await writeAdminUsers(usersPath, [admin, user])
  const token = createSeyfarthUserSessionToken(user, { sessionSecret: "session-placeholder-1234567890abcdef", now: 1_700_000_000_000 })
  const valid = await verifySeyfarthUserSessionToken(token, { usersPath, sessionSecret: "session-placeholder-1234567890abcdef", now: 1_700_000_100_000 })
  assert.equal(valid.ok, true)
  if (valid.ok) assert.equal(valid.user.role, "orders")
  await writeAdminUsers(usersPath, [admin, { ...user, active: false }])
  const disabled = await verifySeyfarthUserSessionToken(token, { usersPath, sessionSecret: "session-placeholder-1234567890abcdef", now: 1_700_000_100_000 })
  assert.equal(disabled.ok, false)
})

test("orders role can manage requests but not users or smtp", () => {
  assert.equal(canSeyfarthRole("orders", "orders:read"), true)
  assert.equal(canSeyfarthRole("orders", "orders:update"), true)
  assert.equal(canSeyfarthRole("orders", "users:manage"), false)
  assert.equal(canSeyfarthRole("orders", "smtp:update"), false)
  assert.equal(canSeyfarthRole("admin", "users:manage"), true)
  assert.equal(canSeyfarthRole("admin", "smtp:update"), true)
})


test("temporary admin users must change password before role-gated access", async () => {
  const dir = await mkdtemp(join(tmpdir(), "seyfarth-admin-force-change-"))
  const usersPath = join(dir, "admin-users.json")
  const admin = await createAdminUserRecord({ email: "admin@seyfarth.test", name: "Admin", role: "admin", password: "sehr-sicheres-passwort" })
  const temp = await createAdminUserRecord({ email: "info@vision-x-digital.de", name: "Vision X Digital", role: "admin", password: "temporaeres-passwort-123", mustChangePassword: true })
  await writeAdminUsers(usersPath, [admin, temp])
  const users = await readAdminUsers(usersPath)
  assert.equal(users.find((row) => row.email === "info@vision-x-digital.de")?.mustChangePassword, true)
  assert.equal(sanitizeAdminUser(temp).mustChangePassword, true)
  await assert.rejects(() => changeOwnAdminPassword(temp.id, { currentPassword: "falsch", newPassword: "neues-sicheres-passwort" }, usersPath), /Aktuelles Passwort/)
  await assert.rejects(() => changeOwnAdminPassword(temp.id, { currentPassword: "temporaeres-passwort-123", newPassword: "temporaeres-passwort-123" }, usersPath), /unterscheiden/)
  const oldToken = createSeyfarthUserSessionToken(temp, { sessionSecret: "session-placeholder-1234567890abcdef", now: 1_700_000_000_000 })
  const changed = await changeOwnAdminPassword(temp.id, { currentPassword: "temporaeres-passwort-123", newPassword: "neues-sicheres-passwort" }, usersPath)
  assert.equal(changed.mustChangePassword, false)
  const oldSession = await verifySeyfarthUserSessionToken(oldToken, { usersPath, sessionSecret: "session-placeholder-1234567890abcdef", now: 1_700_000_100_000 })
  assert.equal(oldSession.ok, false)
  const changedUsers = await readAdminUsers(usersPath)
  const changedUser = changedUsers.find((row) => row.id === temp.id)
  assert.equal(changedUser?.mustChangePassword, false)
  assert.equal(await verifyAdminPassword("neues-sicheres-passwort", changedUser?.passwordHash || ""), true)
})
