import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_SCHEDULE_MODULE } from "../../../../../modules/delivery_schedule"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryScheduleService = req.scope.resolve(DELIVERY_SCHEDULE_MODULE)

  const body = req.body as Record<string, unknown>
  const schedule = await deliveryScheduleService.updateDeliverySchedules({
    id: req.params.id,
    status: "rejected",
    admin_note: body.admin_note as string,
  })

  res.json({ delivery_schedule: schedule })
}
