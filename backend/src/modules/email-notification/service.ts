import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type { ProviderSendNotificationDTO, ProviderSendNotificationResultsDTO } from "@medusajs/types"
import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import type { Logger } from "@medusajs/framework/types"

type EmailNotificationOptions = {
  host: string
  port: number
  user: string
  pass: string
  from: string
  from_name: string
}

type InjectedDependencies = {
  logger: Logger
}

const TEMPLATES: Record<string, (data: Record<string, unknown>) => { subject: string; html: string }> = {
  "order-placed": (data) => ({
    subject: `Bestellbestaetigung #${data.display_id}`,
    html: `
      <h1>Vielen Dank fuer Ihre Bestellung!</h1>
      <p>Ihre Bestellung <strong>#${data.display_id}</strong> wurde erfolgreich aufgegeben.</p>
      <p>Wir bearbeiten Ihre Bestellung und melden uns in Kuerze bei Ihnen.</p>
      <br/>
      <p>Mit freundlichen Gruessen,<br/>Seyfarth Container-Dienst</p>
    `,
  }),
  "order-placed-internal": (data) => ({
    subject: `Neue Bestellung #${data.display_id} eingegangen`,
    html: `
      <h1>Neue Bestellung eingegangen</h1>
      <p>Bestellung <strong>#${data.display_id}</strong> von <strong>${data.email}</strong>.</p>
      <p>Bestell-ID: ${data.order_id}</p>
      <br/>
      <p>Bitte pruefen Sie die Bestellung im Admin-Dashboard.</p>
    `,
  }),
}

export class EmailNotificationService extends AbstractNotificationProviderService {
  static identifier = "email-notification"

  private transporter_: Transporter
  private config_: EmailNotificationOptions
  private logger_: Logger

  constructor({ logger }: InjectedDependencies, options: EmailNotificationOptions) {
    super()
    this.logger_ = logger
    this.config_ = options

    this.transporter_ = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.port === 465,
      auth: {
        user: options.user,
        pass: options.pass,
      },
    })
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    if (!notification) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No notification information provided"
      )
    }

    const from = notification.from?.trim() || `"${this.config_.from_name}" <${this.config_.from}>`

    let subject: string
    let html: string

    if (notification.content?.subject || notification.content?.html) {
      subject = notification.content.subject || ""
      html = notification.content.html || notification.content.text || ""
    } else {
      const templateFn = TEMPLATES[notification.template]
      if (templateFn && notification.data) {
        const rendered = templateFn(notification.data)
        subject = rendered.subject
        html = rendered.html
      } else {
        subject = `Benachrichtigung: ${notification.template}`
        html = `<pre>${JSON.stringify(notification.data, null, 2)}</pre>`
      }
    }

    const attachments = Array.isArray(notification.attachments)
      ? notification.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.content_type,
          cid: a.id,
        }))
      : undefined

    try {
      const info = await this.transporter_.sendMail({
        from,
        to: notification.to,
        subject,
        html,
        attachments,
      })

      this.logger_.info(
        `Email sent to ${notification.to} (template: ${notification.template}, messageId: ${info.messageId})`
      )

      return { id: info.messageId }
    } catch (error) {
      this.logger_.error(
        `Failed to send email to ${notification.to}: ${(error as Error).message}`
      )
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email to ${notification.to}: ${(error as Error).message}`
      )
    }
  }
}
