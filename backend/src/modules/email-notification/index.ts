import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import { EmailNotificationService } from "./service"

const services = [EmailNotificationService]

export default ModuleProvider(Modules.NOTIFICATION, {
  services,
})
