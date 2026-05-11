import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_SCHEDULE_MODULE } from "../../../modules/delivery_schedule"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryScheduleService = req.scope.resolve(DELIVERY_SCHEDULE_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const schedules = await deliveryScheduleService.listDeliverySchedules({
    customer_id: customerId,
  })

  res.json({ delivery_schedules: schedules })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryScheduleService = req.scope.resolve(DELIVERY_SCHEDULE_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const body = req.body as Record<string, unknown>
  const schedule = await deliveryScheduleService.createDeliverySchedules({
    customer_id: customerId,
    requested_date: body.requested_date as string,
    order_id: (body.order_id as string) || null,
  })

  res.status(201).json({ delivery_schedule: schedule })
}
