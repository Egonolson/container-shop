import { model } from "@medusajs/framework/utils"

const DeliveryLocation = model.define("delivery_location", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  name: model.text(),
  street: model.text(),
  zip_code: model.text(),
  city: model.text(),
  contact_person: model.text().nullable(),
  contact_phone: model.text().nullable(),
  notes: model.text().nullable(),
  is_active: model.boolean().default(true),
})

export default DeliveryLocation
