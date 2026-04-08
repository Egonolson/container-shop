import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WASTE_CODE_MODULE } from "../../../modules/waste_code"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const wasteCodeService = req.scope.resolve(WASTE_CODE_MODULE)
  const category = req.query.category as string | undefined

  const filters: any = { is_active: true }
  if (category) filters.category = category

  const wasteCodes = await wasteCodeService.listWasteCodes(filters)
  res.json({ waste_codes: wasteCodes })
}
