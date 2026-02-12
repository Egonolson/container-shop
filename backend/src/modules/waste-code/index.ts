import { Module } from "@medusajs/framework/utils"
import WasteCodeService from "./service"

export const WASTE_CODE_MODULE = "waste-code"
export default Module(WASTE_CODE_MODULE, { service: WasteCodeService })
