import nodemailer from "nodemailer"
import { readSmtpSettings, resolveSmtpPassword, type SmtpSettings } from "./seyfarth-smtp-settings"
import type { ShopRequestEntry } from "./seyfarth-request-store"
type MailResult = { sent: boolean; skipped?: boolean; message?: string }
function getContact(entry: ShopRequestEntry) { return entry.contact && typeof entry.contact === "object" ? entry.contact as Record<string, unknown> : {} }
function subjectFor(entry: ShopRequestEntry, settings: SmtpSettings) { return `${settings.subjectPrefix || "Seyfarth Anfrage"} ${entry.requestId}`.trim() }
function textFor(entry: ShopRequestEntry) {
  const contact = getContact(entry); const location = entry.location && typeof entry.location === "object" ? entry.location as Record<string, unknown> : {}
  return [`Neue Seyfarth-Anfrage: ${entry.requestId}`, `Eingang: ${entry.receivedAt}`, `Bereich: ${entry.mode || "-"}`, `Vorgang: ${entry.intent || "inquiry"}`, `Name: ${contact.name || "-"}`, `Firma: ${contact.company || "-"}`, `E-Mail: ${contact.email || "-"}`, `Telefon: ${contact.phone || "-"}`, `Adresse: ${contact.street || "-"}, ${contact.postalCode || "-"} ${contact.city || "-"}`, `Lieferort: ${location.postalCode || "-"} ${location.city || "-"}`, `Zone bekannt: ${location.zoneKnown === true ? "ja" : "nein"}`, "", "Auswahl:", JSON.stringify(entry.selection || {}, null, 2), "", "Nachricht:", String(contact.message || "-")].join("\n")
}
export async function sendShopRequestNotification(entry: ShopRequestEntry): Promise<MailResult> {
  const settings = await readSmtpSettings(); if (!settings.enabled) return { sent: false, skipped: true, message: "SMTP ist nicht aktiviert." }
  const password = resolveSmtpPassword(settings); if (!password) return { sent: false, skipped: true, message: "SMTP-Passwort ist nicht konfiguriert." }
  const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: settings.username ? { user: settings.username, pass: password } : undefined })
  const contact = getContact(entry)
  await transporter.sendMail({ from: settings.fromEmail, to: settings.toEmail, replyTo: settings.replyToSender && typeof contact.email === "string" ? contact.email : undefined, subject: subjectFor(entry, settings), text: textFor(entry) })
  return { sent: true }
}
export async function sendSmtpTestMail(toEmail?: string) {
  const settings = await readSmtpSettings(); if (!settings.enabled) throw new Error("SMTP ist nicht aktiviert.")
  const password = resolveSmtpPassword(settings); if (!password) throw new Error("SMTP-Passwort ist nicht konfiguriert.")
  const transporter = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.secure, auth: settings.username ? { user: settings.username, pass: password } : undefined })
  await transporter.sendMail({ from: settings.fromEmail, to: toEmail || settings.toEmail, subject: `${settings.subjectPrefix || "Seyfarth"} Test-E-Mail`, text: "Dies ist eine Test-E-Mail aus dem Seyfarth-Backoffice." })
}
