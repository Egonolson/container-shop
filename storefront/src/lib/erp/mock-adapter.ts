import type { CotrasAdapter } from "./adapter"
import type {
  ErpArticle,
  ErpConstructionSite,
  ErpContainerType,
  ErpCustomer,
  ErpInvoice,
  ErpTransportZone,
  ErpZoneLocation,
} from "./types"

// Stand-in for the real ERP until the CoTraS API is delivered. Returns
// catalog-shaped fixtures (the same recurring IDs as the API requirements
// catalog) so the whole sync + matching + admin pipeline runs and is testable
// end-to-end today. Replace by CotrasHttpAdapter later; nothing else changes.

const customers: ErpCustomer[] = [
  {
    customer_id: "K-10234",
    customer_kind: "gewerblich",
    company_name: "Bauunternehmen Müller & Söhne GmbH",
    emails: ["info@mueller-soehne-bau.de", "buchhaltung@mueller-soehne-bau.de"],
    vat_id: "DE812345678",
    billing_address: { street: "Leipziger Straße", house_number: "14a", postal_code: "04600", city: "Altenburg", country: "DE" },
    status: "aktiv",
    updated_at: "2026-06-28T14:32:11Z",
  },
  {
    customer_id: "K-20517",
    customer_kind: "privat",
    first_name: "Jörg",
    last_name: "Weißgerber",
    emails: ["joerg.weissgerber@example.de"],
    billing_address: { street: "Käthe-Kollwitz-Straße", house_number: "3", postal_code: "07546", city: "Gera", country: "DE" },
    status: "aktiv",
    updated_at: "2026-07-01T06:05:43Z",
  },
]

const articles: ErpArticle[] = [
  { artikelnummer: "ENT-170107", typ: "abfall", kategorie: "Bauschutt", bezeichnung: "Bauschutt rein", avv_schluessel: "170107", gefahrstoff: false, preis_netto: 23.5, preiseinheit: "t", ust_satz: 19, gueltig_ab: "2026-04-01" },
  { artikelnummer: "ENT-170603", typ: "abfall", kategorie: "Gefährliche Abfälle", bezeichnung: "Mineralwolle / KMF", avv_schluessel: "170603*", gefahrstoff: true, preis_netto: 790, preiseinheit: "t", ust_satz: 19, gueltig_ab: "2026-04-01" },
  { artikelnummer: "BST-KIE-0032", typ: "baustoff", kategorie: "Kiese", bezeichnung: "Frostschutzkies 0/32", preis_netto: 19.5, preiseinheit: "t", ust_satz: 19, gueltig_ab: "2026-04-01" },
]

const containerTypes: ErpContainerType[] = [
  { containertyp_id: "ABS-07", art: "absetzer", volumen_m3: 7, bezeichnung: "Absetzcontainer 7 m³", preisklasse: "absetzer" },
  { containertyp_id: "ABR-20", art: "abroller", volumen_m3: 20, bezeichnung: "Abrollcontainer 20 m³", preisklasse: "abroller_15_40" },
]

const transportZones: ErpTransportZone[] = [
  { zone: 1, ust_satz: 19, gestellung_netto: { multicar: 89, absetzer: 104 }, schuettgut_lieferung_netto: { multicar: 60 } },
  { zone: 2, ust_satz: 19, gestellung_netto: { multicar: 95, absetzer: 115 }, schuettgut_lieferung_netto: { multicar: 65 } },
]

const zoneLocations: ErpZoneLocation[] = [
  { plz: "04639", ort: "Ponitz", zone: 1 },
  { plz: "07545", ort: "Gera", zone: 2 },
]

const constructionSites: ErpConstructionSite[] = [
  { site_id: "BST-000482", customer_id: "K-10234", name: "Neubau Bürokomplex Leipziger Straße", street: "Leipziger Straße", house_number: "20", postal_code: "04600", city: "Altenburg", status: "aktiv" },
]

const invoices: ErpInvoice[] = [
  { invoice_id: "RE-2026-01831", customer_id: "K-10234", invoice_number: "RE-2026-01831", invoice_date: "2026-06-30", total_gross: 428.61, status: "offen" },
]

export class MockCotrasAdapter implements CotrasAdapter {
  readonly source = "mock" as const
  async fetchCustomers() {
    return customers
  }
  async fetchArticles() {
    return articles
  }
  async fetchContainerTypes() {
    return containerTypes
  }
  async fetchTransportZones() {
    return transportZones
  }
  async fetchZoneLocations() {
    return zoneLocations
  }
  async fetchConstructionSites() {
    return constructionSites
  }
  async fetchInvoices() {
    return invoices
  }
}
