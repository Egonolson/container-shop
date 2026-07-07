import { createHash } from "node:crypto"
import type {
  ErpArticle,
  ErpConstructionSite,
  ErpContainerType,
  ErpCustomer,
  ErpInvoice,
  ErpTransportZone,
  ErpZoneLocation,
} from "./types"

// A mirror row: stable external_id + raw source object + content_hash for
// idempotent hash-diff + promoted columns for querying. Promoted columns are
// entity-specific and merged in by the mappers below.
export type MirrorRow = {
  external_id: string
  raw: unknown
  content_hash: string
  is_deleted: boolean
  synced_at: string
  [promoted: string]: unknown
}

function hash(obj: unknown): string {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex")
}

const now = () => new Date().toISOString()

// Per-entity mappers: ERP object → mirror row. This is the layer that changes
// if the delivered API field names differ from the catalog — the sync engine
// and DB stay untouched.
export const mappers = {
  customers: (c: ErpCustomer): MirrorRow => ({
    external_id: c.customer_id,
    raw: c,
    content_hash: hash(c),
    is_deleted: c.status === "geloescht",
    synced_at: now(),
    customer_kind: c.customer_kind,
    company_name: c.company_name ?? null,
    first_name: c.first_name ?? null,
    last_name: c.last_name ?? null,
    emails: c.emails ?? [],
    vat_id: c.vat_id ?? null,
    postal_code: c.billing_address?.postal_code ?? null,
    city: c.billing_address?.city ?? null,
    status: c.status,
  }),
  articles: (a: ErpArticle): MirrorRow => ({
    external_id: a.artikelnummer,
    raw: a,
    content_hash: hash(a),
    is_deleted: !!a.geloescht,
    synced_at: now(),
    type: a.typ ?? null,
    category: a.kategorie ?? null,
    bezeichnung: a.bezeichnung,
    avv_schluessel: a.avv_schluessel ?? null,
    gefahrstoff: a.gefahrstoff ?? null,
    preis_netto: a.preis_netto,
    preiseinheit: a.preiseinheit,
    ust_satz: a.ust_satz,
    gueltig_ab: a.gueltig_ab ?? null,
  }),
  container_types: (t: ErpContainerType): MirrorRow => ({
    external_id: t.containertyp_id,
    raw: t,
    content_hash: hash(t),
    is_deleted: !!t.geloescht,
    synced_at: now(),
    art: t.art,
    volumen_m3: t.volumen_m3,
    bezeichnung: t.bezeichnung,
    preisklasse: t.preisklasse ?? null,
  }),
  transport_zones: (z: ErpTransportZone): MirrorRow => ({
    external_id: `zone-${z.zone}`,
    raw: z,
    content_hash: hash(z),
    is_deleted: !!z.geloescht,
    synced_at: now(),
    zone: z.zone,
    ust_satz: z.ust_satz,
  }),
  zone_locations: (l: ErpZoneLocation): MirrorRow => ({
    external_id: `${l.plz}-${l.ort}`,
    raw: l,
    content_hash: hash(l),
    is_deleted: !!l.is_deleted,
    synced_at: now(),
    plz: l.plz,
    ort: l.ort,
    zone: l.zone,
  }),
  construction_sites: (s: ErpConstructionSite): MirrorRow => ({
    external_id: s.site_id,
    raw: s,
    content_hash: hash(s),
    is_deleted: !!s.is_deleted,
    synced_at: now(),
    erp_customer_id: s.customer_id,
    name: s.name,
    street: s.street ?? null,
    house_number: s.house_number ?? null,
    postal_code: s.postal_code ?? null,
    city: s.city ?? null,
    status: s.status,
  }),
  invoices: (i: ErpInvoice): MirrorRow => ({
    external_id: i.invoice_id,
    raw: i,
    content_hash: hash(i),
    is_deleted: !!i.is_voided,
    synced_at: now(),
    erp_customer_id: i.customer_id,
    invoice_number: i.invoice_number,
    invoice_date: i.invoice_date,
    total_gross: i.total_gross,
    status: i.status ?? null,
  }),
}

// Which mirror table each entity upserts into.
export const ERP_TABLE: Record<string, string> = {
  customers: "erp_customers",
  articles: "erp_articles",
  container_types: "erp_container_types",
  transport_zones: "erp_transport_zones",
  zone_locations: "erp_zone_locations",
  construction_sites: "erp_construction_sites",
  invoices: "erp_invoices",
}
