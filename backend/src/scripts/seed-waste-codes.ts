import { ExecArgs } from "@medusajs/framework/types"

export default async function seedWasteCodes({ container }: ExecArgs) {
  const wasteCodeService = container.resolve("waste-code")

  const codes = [
    { avv_number: "17 01 01", title: "Beton", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Reiner Beton ohne Verunreinigungen" },
    { avv_number: "17 01 02", title: "Ziegel", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Ziegel und Mauerwerk" },
    { avv_number: "17 01 07", title: "Gemische aus Beton, Ziegel, Fliesen", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Gemischter Bauschutt (sortenrein mineralisch)" },
    { avv_number: "17 02 01", title: "Holz", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Unbehandeltes und behandeltes Holz (A1-A3)" },
    { avv_number: "17 02 04*", title: "Holz mit gefährlichen Stoffen", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_gewabfv_declaration: false, warning_text: "Gefährlicher Abfall — Erzeugernummer erforderlich. Entsorgungsnachweis wird benötigt.", description: "Holz A4 (z.B. Bahnschwellen, CKB-behandelt)" },
    { avv_number: "17 05 04", title: "Boden und Steine", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Erdaushub ohne gefährliche Stoffe" },
    { avv_number: "17 05 03*", title: "Boden mit gefährlichen Stoffen", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_gewabfv_declaration: false, warning_text: "Gefährlicher Abfall — Erzeugernummer + Analytik erforderlich.", description: "Kontaminierter Erdaushub" },
    { avv_number: "17 06 01*", title: "Dämmmaterial mit Asbest", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "ASBEST — TRGS 519 Sachkundenachweis erforderlich! Nur durch zugelassene Fachfirmen zu entsorgen.", description: "Asbesthaltige Baustoffe" },
    { avv_number: "17 06 05*", title: "Asbesthaltige Baustoffe", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "ASBEST — TRGS 519 Sachkundenachweis erforderlich!", description: "Asbest-Zementplatten, Eternit etc." },
    { avv_number: "17 06 03*", title: "KMF-Dämmstoffe", category: "Bau- und Abbruchabfälle", is_hazardous: true, requires_trgs519: true, requires_gewabfv_declaration: false, warning_text: "KMF — TRGS 519 Sachkundenachweis erforderlich!", description: "Künstliche Mineralfasern (alte Mineralwolle)" },
    { avv_number: "17 09 04", title: "Gemischte Bau- und Abbruchabfälle", category: "Bau- und Abbruchabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "Gemischter Gewerbeabfall — GewAbfV-Erklärung erforderlich (Begründung Nicht-Trennung).", description: "Baumischabfall (nicht sortenrein)" },
    { avv_number: "20 03 01", title: "Gemischte Siedlungsabfälle", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "Gemischter Gewerbeabfall — GewAbfV-Erklärung erforderlich.", description: "Gewerblicher Restmüll / Mischmüll" },
    { avv_number: "20 01 01", title: "Papier und Pappe", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Sortenrein gesammeltes Papier/Pappe" },
    { avv_number: "20 02 01", title: "Grünschnitt", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: false, description: "Garten- und Parkabfälle" },
    { avv_number: "20 03 07", title: "Sperrmüll", category: "Siedlungsabfälle", is_hazardous: false, requires_gewabfv_declaration: true, warning_text: "GewAbfV-Erklärung erforderlich bei gewerblicher Entsorgung.", description: "Sperrige Abfälle" },
  ]

  for (const code of codes) {
    await wasteCodeService.createWasteCodes({ ...code, is_active: true })
  }

  console.log(`Seed complete: ${codes.length} AVV-Abfallschlüssel erstellt`)
}
