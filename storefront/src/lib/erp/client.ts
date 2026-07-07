import type { CotrasAdapter } from "./adapter"
import { MockCotrasAdapter } from "./mock-adapter"

// Selects the ERP adapter. Until the CoTraS API is delivered this returns the
// mock. Going live: implement CotrasHttpAdapter (reads base_url + api_key from
// erp_connection) and return it here when erp_connection.enabled is true.
export function getErpAdapter(): CotrasAdapter {
  return new MockCotrasAdapter()
}
