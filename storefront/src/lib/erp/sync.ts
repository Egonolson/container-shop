import "server-only"
import { createRawAdminClient } from "@/lib/supabase/admin"
import type { CotrasAdapter } from "./adapter"
import { getErpAdapter } from "./client"
import { ERP_TABLE, mappers, type MirrorRow } from "./map"
import type { ErpEntity } from "./types"
import { ERP_ENTITIES } from "./types"

export type SyncResult = { entity: ErpEntity; inserted: number; updated: number; deleted: number; errors: number }

// Generic, idempotent hash-diff sync for one entity into its mirror table.
// Only rows whose content_hash changed are written; records absent from the
// source (or flagged deleted) are tombstoned (never hard-deleted). Every run
// and error is logged. Works identically for the mock and the real adapter.
async function syncEntity(adapter: CotrasAdapter, entity: ErpEntity): Promise<SyncResult> {
  const supabase = createRawAdminClient()
  const table = ERP_TABLE[entity]
  const result: SyncResult = { entity, inserted: 0, updated: 0, deleted: 0, errors: 0 }

  const { data: run } = await supabase
    .from("sync_runs")
    .insert({ entity, source: adapter.source, status: "running" })
    .select("id")
    .single()
  const runId = run?.id ?? null

  const logError = async (external_id: string | null, message: string, payload?: unknown) => {
    result.errors += 1
    await supabase.from("sync_errors").insert({ run_id: runId, entity, external_id, message, payload: (payload ?? null) as never })
  }

  try {
    const fetchers: Record<ErpEntity, () => Promise<unknown[]>> = {
      customers: () => adapter.fetchCustomers(),
      articles: () => adapter.fetchArticles(),
      container_types: () => adapter.fetchContainerTypes(),
      transport_zones: () => adapter.fetchTransportZones(),
      zone_locations: () => adapter.fetchZoneLocations(),
      construction_sites: () => adapter.fetchConstructionSites(),
      invoices: () => adapter.fetchInvoices(),
    }
    const mapFn = (mappers as Record<string, (o: unknown) => MirrorRow>)[entity]
    const source = await fetchers[entity]()

    const rows: MirrorRow[] = []
    for (const obj of source) {
      try {
        rows.push(mapFn(obj))
      } catch (e) {
        await logError(null, e instanceof Error ? e.message : "map error", obj)
      }
    }

    // Existing hashes for hash-diff.
    const { data: existing } = await supabase.from(table).select("external_id, content_hash")
    const existingHash = new Map((existing ?? []).map((r) => [r.external_id as string, r.content_hash as string]))
    const sourceIds = new Set(rows.map((r) => r.external_id))

    const changed = rows.filter((r) => existingHash.get(r.external_id) !== r.content_hash)
    for (const row of changed) {
      const isNew = !existingHash.has(row.external_id)
      const { error } = await supabase.from(table).upsert(row as never, { onConflict: "external_id" })
      if (error) {
        await logError(row.external_id, error.message)
        continue
      }
      if (isNew) result.inserted += 1
      else result.updated += 1
    }

    // Tombstone rows no longer present in the source (full reconciliation).
    const staleIds = (existing ?? [])
      .map((r) => r.external_id as string)
      .filter((id) => !sourceIds.has(id))
    if (staleIds.length > 0) {
      const { error } = await supabase.from(table).update({ is_deleted: true } as never).in("external_id", staleIds)
      if (error) await logError(null, `tombstone: ${error.message}`)
      else result.deleted += staleIds.length
    }

    await supabase
      .from("sync_runs")
      .update({ finished_at: new Date().toISOString(), status: result.errors > 0 ? "error" : "ok", inserted: result.inserted, updated: result.updated, deleted: result.deleted, errors: result.errors })
      .eq("id", runId)
  } catch (e) {
    await logError(null, e instanceof Error ? e.message : "sync failed")
    await supabase.from("sync_runs").update({ finished_at: new Date().toISOString(), status: "error", errors: result.errors }).eq("id", runId)
  }

  return result
}

// Runs a full sync across all entities (or a subset). Used by the admin
// "Sync starten" action and, later, a schedule.
export async function runErpSync(entities: ErpEntity[] = ERP_ENTITIES): Promise<SyncResult[]> {
  const adapter = getErpAdapter()
  const results: SyncResult[] = []
  for (const entity of entities) {
    results.push(await syncEntity(adapter, entity))
  }
  return results
}
