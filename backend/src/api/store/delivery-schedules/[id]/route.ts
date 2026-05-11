import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_SCHEDULE_MODULE } from "../../../../modules/delivery_schedule"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryScheduleService = req.scope.resolve(DELIVERY_SCHEDULE_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const schedule = await deliveryScheduleService.retrieveDeliverySchedule(req.params.id)

  if (schedule.customer_id !== customerId) {
    return res.status(403).json({ message: "Forbidden" })
  }

  res.json({ delivery_schedule: schedule })
}
