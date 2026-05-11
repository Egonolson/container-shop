import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_SCHEDULE_MODULE } from "../../../modules/delivery_schedule"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryScheduleService = req.scope.resolve(DELIVERY_SCHEDULE_MODULE)

  const filter: Record<string, string> = {}
  if (req.query.status) {
    filter.status = req.query.status as string
  }

  const schedules = await deliveryScheduleService.listDeliverySchedules(filter)

  res.json({ delivery_schedules: schedules })
}
