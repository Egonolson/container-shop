import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

const OPERATOR_EMAIL = process.env.OPERATOR_EMAIL || "info@seyfarth-container.de"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const notificationService = container.resolve(Modules.NOTIFICATION)
  const orderService = container.resolve(Modules.ORDER)

  const order = await orderService.retrieveOrder(data.id, {
    relations: ["items"],
  })

  if (!order.email) {
    return
  }

  const orderData: Record<string, unknown> = {
    order_id: order.id,
    display_id: order.display_id,
    email: order.email,
    items: order.items,
    total: order.total,
    metadata: order.metadata,
  }

  // Send confirmation email to the customer
  await notificationService.createNotifications({
    to: order.email,
    channel: "email",
    template: "order-placed",
    data: orderData,
  })

  // Send notification email to the operator
  await notificationService.createNotifications({
    to: OPERATOR_EMAIL,
    channel: "email",
    template: "order-placed-internal",
    data: orderData,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
