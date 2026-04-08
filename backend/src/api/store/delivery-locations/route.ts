import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_LOCATION_MODULE } from "../../../modules/delivery_location"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const locations = await deliveryLocationService.listDeliveryLocations({
    customer_id: customerId,
    is_active: true,
  })

  res.json({ delivery_locations: locations })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const deliveryLocationService = req.scope.resolve(DELIVERY_LOCATION_MODULE)
  const customerId = (req as any).auth_context?.actor_id

  if (!customerId) {
    return res.status(401).json({ message: "Not authenticated" })
  }

  const body = req.body as Record<string, unknown>
  const location = await deliveryLocationService.createDeliveryLocations({
    ...body,
    customer_id: customerId,
  })

  res.status(201).json({ delivery_location: location })
}
