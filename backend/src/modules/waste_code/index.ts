import { Module } from "@medusajs/framework/utils"
import WasteCodeService from "./service"

export const WASTE_CODE_MODULE = "waste_code"
export default Module(WASTE_CODE_MODULE, { service: WasteCodeService })
