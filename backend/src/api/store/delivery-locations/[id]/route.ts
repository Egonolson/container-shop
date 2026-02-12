import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_LOCATION_MODULE } from "../../../../modules/delivery-location"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const location = await deliveryLocationService.retrieveDeliveryLocation(req.params.id)
  res.json({ delivery_location: location })
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const location = await deliveryLocationService.updateDeliveryLocations({
    id: req.params.id,
    ...req.body,
  })
  res.json({ delivery_location: location })
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  await deliveryLocationService.updateDeliveryLocations({
    id: req.params.id,
    is_active: false,
  })
  res.status(200).json({ success: true })
}
