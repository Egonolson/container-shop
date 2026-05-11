import { Module } from "@medusajs/framework/utils"
import GewAbfVService from "./service"

export const GEWABFV_MODULE = "gewabfv"
export default Module(GEWABFV_MODULE, { service: GewAbfVService })
