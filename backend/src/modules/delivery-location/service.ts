import { MedusaService } from "@medusajs/framework/utils"
import DeliveryLocation from "./models/delivery-location"

class DeliveryLocationService extends MedusaService({
  DeliveryLocation,
}) {}

export default DeliveryLocationService
