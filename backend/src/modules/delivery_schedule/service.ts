import { MedusaService } from "@medusajs/framework/utils"
import DeliverySchedule from "./models/delivery_schedule"

class DeliveryScheduleService extends MedusaService({
  DeliverySchedule,
}) {}

export default DeliveryScheduleService
