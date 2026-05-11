import { model } from "@medusajs/framework/utils"

const WasteCode = model.define("waste_code", {
  id: model.id().primaryKey(),
  avv_number: model.text(),
  title: model.text(),
  category: model.text(),
  is_hazardous: model.boolean().default(false),
  requires_trgs519: model.boolean().default(false),
  description: model.text().nullable(),
  warning_text: model.text().nullable(),
  requires_gewabfv_declaration: model.boolean().default(false),
  is_active: model.boolean().default(true),
})

export default WasteCode
