import type SMTPTransport from "nodemailer/lib/smtp-transport"

export type SmtpSettings = {
  host: string | null
  port: number
  secure: boolean
  username: string | null
  password_cipher: string | null
  from_email: string | null
  from_name: string
}

export type MailInput = { to: string; subject: string; text: string; html?: string }

export function smtpOptionsFrom(s: SmtpSettings, password?: string): SMTPTransport.Options {
  return {
    host: s.host!,
    port: s.port,
    secure: s.secure,
    auth: s.username && password ? { user: s.username, pass: password } : undefined,
  }
}

export function mailMessageFrom(settings: { from_name: string; from_email: string }, input: MailInput) {
  return {
    from: { name: settings.from_name, address: settings.from_email },
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  }
}
