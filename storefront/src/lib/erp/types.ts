// CoTraS ERP entity shapes, modelled on the API requirements catalog
// (docs/plans/2026-07-07-cotras-api-anforderungskatalog.md). These are the
// shapes the adapter must return; the mock adapter already produces them, and
// the real CotrasHttpAdapter must map the actual REST payloads into them.
//
// When the delivered API differs from the catalog, ONLY these types + the
// mappers in map.ts change — the sync engine, mirror tables and admin UI stay.

export type ErpAddress = {
  street?: string | null
  house_number?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
}

export type ErpCustomer = {
  customer_id: string
  customer_kind: "privat" | "gewerblich"
  company_name?: string | null
  first_name?: string | null
  last_name?: string | null
  emails: string[]
  vat_id?: string | null
  billing_address?: ErpAddress | null
  status: "aktiv" | "gesperrt" | "geloescht"
  updated_at?: string | null
}

export type ErpArticle = {
  artikelnummer: string
  typ?: "abfall" | "baustoff" | "sonstiges"
  kategorie?: string | null
  bezeichnung: string
  avv_schluessel?: string | null
  gefahrstoff?: boolean
  preis_netto: number
  preiseinheit: "t" | "stueck" | "m3"
  ust_satz: number
  gueltig_ab?: string | null
  geloescht?: boolean
}

export type ErpContainerType = {
  containertyp_id: string
  art: "absetzer" | "abroller" | "multicar"
  volumen_m3: number
  bezeichnung: string
  preisklasse?: string | null
  geloescht?: boolean
}

export type ErpTransportZone = {
  zone: number
  ust_satz: number
  gestellung_netto?: Record<string, number>
  schuettgut_lieferung_netto?: Record<string, number>
  geloescht?: boolean
}

export type ErpZoneLocation = {
  plz: string
  ort: string
  zone: number
  is_deleted?: boolean
}

export type ErpConstructionSite = {
  site_id: string
  customer_id: string
  name: string
  street?: string | null
  house_number?: string | null
  postal_code?: string | null
  city?: string | null
  status: "aktiv" | "abgeschlossen"
  is_deleted?: boolean
}

export type ErpInvoice = {
  invoice_id: string
  customer_id: string
  invoice_number: string
  invoice_date: string
  total_gross: number
  status?: string | null
  is_voided?: boolean
}

// Entity keys used across sync + admin.
export type ErpEntity =
  | "customers"
  | "articles"
  | "container_types"
  | "transport_zones"
  | "zone_locations"
  | "construction_sites"
  | "invoices"

export const ERP_ENTITIES: ErpEntity[] = [
  "customers",
  "articles",
  "container_types",
  "transport_zones",
  "zone_locations",
  "construction_sites",
  "invoices",
]
