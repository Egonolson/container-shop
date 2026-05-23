import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
export type SmtpSettings = { enabled: boolean; host: string; port: number; secure: boolean; username: string; passwordEnvVar: string; fromEmail: string; toEmail: string; replyToSender: boolean; subjectPrefix: string }
export type SafeSmtpSettings = Omit<SmtpSettings, "passwordEnvVar"> & { passwordEnvVar: string; passwordConfigured: boolean }
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ENV_RE = /^[A-Z0-9_]{3,80}$/
export const DEFAULT_SMTP_SETTINGS: SmtpSettings = { enabled: false, host: "", port: 587, secure: false, username: "", passwordEnvVar: "SEYFARTH_SMTP_PASSWORD", fromEmail: "", toEmail: "", replyToSender: true, subjectPrefix: "Seyfarth Anfrage" }
function clean(value: unknown, max = 240) { return typeof value === "string" ? value.replace(/[\r\n]/g, "").trim().slice(0, max) : "" }
export function getSmtpSettingsPath() { return process.env.SEYFARTH_SMTP_SETTINGS_PATH || `${process.env.SEYFARTH_REQUEST_LOG_PATH || join(process.cwd(), "data", "shop-requests.jsonl")}.smtp.json` }
export function normalizeSmtpSettingsForWrite(value: unknown): SmtpSettings {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const settings: SmtpSettings = { enabled: input.enabled === true, host: clean(input.host), port: typeof input.port === "number" ? Math.trunc(input.port) : Number(input.port || 587), secure: input.secure === true, username: clean(input.username), passwordEnvVar: clean(input.passwordEnvVar || input.password_env_var || DEFAULT_SMTP_SETTINGS.passwordEnvVar, 80), fromEmail: clean(input.fromEmail || input.from_email).toLowerCase(), toEmail: clean(input.toEmail || input.to_email).toLowerCase(), replyToSender: input.replyToSender !== false, subjectPrefix: clean(input.subjectPrefix || input.subject_prefix || DEFAULT_SMTP_SETTINGS.subjectPrefix, 80) }
  if (settings.port < 1 || settings.port > 65535) throw new Error("Bitte prüfen Sie den SMTP-Port.")
  if (settings.passwordEnvVar && !ENV_RE.test(settings.passwordEnvVar)) throw new Error("Die SMTP-Passwort-Umgebungsvariable ist ungültig.")
  if (settings.enabled) { if (!settings.host) throw new Error("Bitte tragen Sie einen SMTP-Host ein."); if (!EMAIL_RE.test(settings.fromEmail)) throw new Error("Bitte prüfen Sie die Absenderadresse."); if (!EMAIL_RE.test(settings.toEmail)) throw new Error("Bitte prüfen Sie die Empfängeradresse.") }
  return settings
}
export function getSafeSmtpSettings(settings: SmtpSettings, env: Record<string, string | undefined> = process.env): SafeSmtpSettings { return { ...settings, passwordConfigured: Boolean(settings.passwordEnvVar && env[settings.passwordEnvVar]) } }
export function resolveSmtpPassword(settings: SmtpSettings, env: Record<string, string | undefined> = process.env) { return settings.passwordEnvVar ? env[settings.passwordEnvVar] || "" : "" }
export async function readSmtpSettings(filePath = getSmtpSettingsPath()) { try { return normalizeSmtpSettingsForWrite(JSON.parse(await readFile(filePath, "utf8"))) } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return DEFAULT_SMTP_SETTINGS; throw error } }
export async function writeSmtpSettings(settings: SmtpSettings, filePath = getSmtpSettingsPath()) { await mkdir(dirname(filePath), { recursive: true }); const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`; await writeFile(tmp, JSON.stringify(settings, null, 2), { encoding: "utf8", mode: 0o600 }); await rename(tmp, filePath); return settings }
