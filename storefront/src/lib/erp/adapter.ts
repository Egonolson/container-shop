import type {
  ErpArticle,
  ErpConstructionSite,
  ErpContainerType,
  ErpCustomer,
  ErpInvoice,
  ErpTransportZone,
  ErpZoneLocation,
} from "./types"

// The single seam between the sync engine and the ERP. Everything above this
// interface (sync engine, mirror tables, matching, admin UI) is done and
// works against MockCotrasAdapter. Going live = implement CotrasHttpAdapter
// (REST calls per the API catalog) and select it in erp/client.ts.
//
// Each method returns the full current set (or a delta if `since` is given).
// Delta support is optional for the first cut — the engine also does full
// reconciliation runs.
export interface CotrasAdapter {
  readonly source: "mock" | "cotras"
  fetchCustomers(since?: string): Promise<ErpCustomer[]>
  fetchArticles(since?: string): Promise<ErpArticle[]>
  fetchContainerTypes(since?: string): Promise<ErpContainerType[]>
  fetchTransportZones(since?: string): Promise<ErpTransportZone[]>
  fetchZoneLocations(since?: string): Promise<ErpZoneLocation[]>
  fetchConstructionSites(since?: string): Promise<ErpConstructionSite[]>
  fetchInvoices(since?: string): Promise<ErpInvoice[]>
}
