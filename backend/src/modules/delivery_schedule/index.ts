import { Module } from "@medusajs/framework/utils"
import DeliveryScheduleService from "./service"

export const DELIVERY_SCHEDULE_MODULE = "delivery_schedule"

export default Module(DELIVERY_SCHEDULE_MODULE, {
  service: DeliveryScheduleService,
})
