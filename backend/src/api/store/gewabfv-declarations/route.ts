import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GEWABFV_MODULE } from "../../../modules/gewabfv"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const gewabfvService = req.scope.resolve(GEWABFV_MODULE)
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const declarations = await gewabfvService.listGewAbfVDeclarations({
    customer_id: customerId,
  })
  res.json({ declarations })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const gewabfvService = req.scope.resolve(GEWABFV_MODULE)
  const customerId = (req as any).auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Not authenticated" })

  const body = req.body as Record<string, unknown>
  const declaration = await gewabfvService.createGewAbfVDeclarations({
    ...body,
    customer_id: customerId,
    signed_at: new Date(),
    year: new Date().getFullYear(),
  })
  res.status(201).json({ declaration })
}
