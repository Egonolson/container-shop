import { Module } from "@medusajs/framework/utils"
import DeliveryLocationService from "./service"

export const DELIVERY_LOCATION_MODULE = "delivery_location"

export default Module(DELIVERY_LOCATION_MODULE, {
  service: DeliveryLocationService,
})
