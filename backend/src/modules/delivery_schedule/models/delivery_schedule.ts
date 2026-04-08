import { model } from "@medusajs/framework/utils"

const DeliverySchedule = model.define("delivery_schedule", {
  id: model.id().primaryKey(),
  customer_id: model.text(),
  order_id: model.text().nullable(),
  requested_date: model.text(),
  confirmed_date: model.text().nullable(),
  status: model.text().default("requested"),
  admin_note: model.text().nullable(),
})

export default DeliverySchedule
