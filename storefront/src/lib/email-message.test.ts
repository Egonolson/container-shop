import assert from "node:assert/strict"
import { describe, it } from "node:test"
import nodemailer from "nodemailer"
import { mailMessageFrom, smtpOptionsFrom, type SmtpSettings } from "./email-message.ts"

const settings = {
  host: "smtp.example.test",
  port: 587,
  secure: false,
  username: "fixture-user",
  password_cipher: null,
  from_email: "sender@example.test",
  from_name: 'Service "Team", Büro',
} satisfies SmtpSettings
const input = {
  to: "recipient@example.test",
  subject: "Testanfrage",
  text: "Text der fiktiven Anfrage.",
  html: "<p>Text der fiktiven Anfrage.</p>",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

describe("local Nodemailer compatibility", () => {
  it("preserves the complete sender display name and one recipient in JSON transport", async () => {
    const transport = nodemailer.createTransport({ jsonTransport: true })
    const info = await transport.sendMail(mailMessageFrom(settings, input))
    assert.deepEqual(info.envelope, { from: settings.from_email, to: [input.to] })
    const message: unknown = JSON.parse(info.message)
    assert.ok(isRecord(message))
    assert.deepEqual(message.from, { address: settings.from_email, name: settings.from_name })
    assert.deepEqual(message.to, [{ address: input.to, name: "" }])
    assert.equal(message.subject, input.subject)
    assert.equal(message.text, input.text)
    assert.equal(message.html, input.html)
  })

  it("composes a multipart message locally without SMTP or external delivery", async () => {
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" })
    const info = await transport.sendMail(mailMessageFrom(settings, input))
    assert.deepEqual(info.envelope, { from: settings.from_email, to: [input.to] })
    assert.ok(Buffer.isBuffer(info.message))
    const message = info.message.toString("utf8")
    assert.ok(message.includes("Subject: Testanfrage\r\n"))
    assert.ok(message.includes("Content-Type: multipart/alternative;"))
    assert.ok(message.includes(input.text))
    assert.ok(message.includes(input.html))
    assert.ok(message.includes("To: recipient@example.test\r\n"))
  })

  it("preserves STARTTLS and implicit TLS configuration without weakening verification", () => {
    const startTls = smtpOptionsFrom(settings, "fixture-password")
    assert.equal(startTls.host, settings.host)
    assert.equal(startTls.port, 587)
    assert.equal(startTls.secure, false)
    assert.equal(startTls.ignoreTLS, undefined)
    assert.equal(startTls.requireTLS, undefined)
    assert.equal(startTls.tls?.rejectUnauthorized, undefined)
    assert.deepEqual(startTls.auth, { user: settings.username, pass: "fixture-password" })
    const implicitTls = smtpOptionsFrom({ ...settings, port: 465, secure: true })
    assert.equal(implicitTls.port, 465)
    assert.equal(implicitTls.secure, true)
    assert.equal(implicitTls.auth, undefined)
  })

  it("omits authentication when either configured credential is missing", () => {
    assert.equal(smtpOptionsFrom(settings).auth, undefined)
    assert.equal(smtpOptionsFrom({ ...settings, username: null }, "fixture-password").auth, undefined)
  })
})
