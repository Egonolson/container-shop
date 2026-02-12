import { model } from "@medusajs/framework/utils"

const GewAbfVDeclaration = model.define("gewabfv_declaration", {
  id: model.id().primaryKey(),
  order_id: model.text().nullable(),
  customer_id: model.text(),
  delivery_location_id: model.text(),
  avv_number: model.text(),
  is_separated: model.boolean().default(false),
  justification_type: model.text().nullable(),
  justification_text: model.text().nullable(),
  signed_at: model.dateTime().nullable(),
  year: model.number(),
})

export default GewAbfVDeclaration
