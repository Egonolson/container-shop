import { ExecArgs } from "@medusajs/framework/types"
import { readFileSync } from "fs"
import { join } from "path"

interface WasteCodeData {
  avv_number: string
  title: string
  category: string
  is_hazardous: boolean
  requires_gewabfv_declaration: boolean
  requires_trgs519?: boolean
  warning_text?: string
  description: string
}

interface WasteCodeFile {
  _comment: string
  codes: WasteCodeData[]
}

export default async function seedWasteCodes({ container }: ExecArgs) {
  const wasteCodeService = container.resolve("waste_code")

  // Load waste codes from JSON
  const codesPath = join(__dirname, "..", "data", "waste-codes.json")
  const wasteCodeFile: WasteCodeFile = JSON.parse(
    readFileSync(codesPath, "utf-8")
  )

  for (const code of wasteCodeFile.codes) {
    await wasteCodeService.createWasteCodes({ ...code, is_active: true })
  }

  console.log(
    `Seed complete: ${wasteCodeFile.codes.length} AVV-Abfallschlüssel erstellt`
  )
}
