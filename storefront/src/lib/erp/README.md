# ERP-Anbindung (CoTraS) — Fundament

Dieses Verzeichnis ist die vollständige Integrationsschicht zwischen Portal und
CoTraS-ERP. Sie ist **fertig aufgebaut und lauffähig** — mit einem Mock-Adapter
statt der echten API. Spiegel-Tabellen, Sync-Engine, Matching und Admin-UI
laufen heute schon end-to-end. Später bleibt **nur der echte HTTP-Adapter**.

## Architektur (was schon steht)

```
CoTraS API ──▶ CotrasAdapter ──▶ sync.ts ──▶ Spiegel-Tabellen (erp_*)
                (Interface)      (Hash-Diff)   in Supabase (RLS: staff only)
                    ▲                                │
              MockCotrasAdapter                      ▼
              (Fixtures, aktiv)              matching.ts ──▶ customer_erp_links
                                             (4-Feld-Score)   (Freigabe-Queue)
                                                                │
                                                     /admin/erp (Admin-UI)
```

| Baustein | Datei | Status |
|----------|-------|--------|
| Entity-Typen (aus Anforderungskatalog) | `types.ts` | fertig |
| Adapter-Interface | `adapter.ts` | fertig |
| Mock-Adapter + Fixtures | `mock-adapter.ts` | fertig (aktiv) |
| Adapter-Auswahl | `client.ts` | **hier später umschalten** |
| Feld-Mapping ERP→Spiegel + Hash | `map.ts` | fertig (Feldnamen ggf. anpassen) |
| Sync-Engine (idempotent, Läufe/Fehler, Tombstones) | `sync.ts` | fertig |
| Matching-Engine (E-Mail/USt-ID/Name/PLZ) | `matching.ts` | fertig |
| DB-Migration (11 Tabellen, RLS) | `../../../../supabase/migrations/20260707220000_erp_integration.sql` | fertig |
| Admin-UI (Verbindung, Sync, Läufe, Queue) | `../../app/admin/erp/` | fertig |
| Verbindungs-Config (Base-URL, API-Key verschlüsselt) | Tabelle `erp_connection` | fertig |

## Was für die echte Schnittstelle bleibt

Genau **zwei** Dinge — mehr nicht:

### 1. `CotrasHttpAdapter` schreiben (neue Datei `http-adapter.ts`)

Eine Klasse, die `CotrasAdapter` implementiert (siehe `adapter.ts`) und die
sieben `fetch*`-Methoden gegen die echten CoTraS-Endpunkte ausführt. Vorlage ist
`mock-adapter.ts` — gleiche Rückgabetypen, nur echter HTTP-Call statt Fixture.

```ts
// http-adapter.ts (Skizze)
export class CotrasHttpAdapter implements CotrasAdapter {
  readonly source = "cotras" as const
  constructor(private baseUrl: string, private apiKey: string) {}
  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.apiKey}`, Accept: "application/json" },
    })
    if (!res.ok) throw new Error(`CoTraS ${path}: ${res.status}`)
    return res.json()
  }
  async fetchCustomers()       { return this.get<ErpCustomer[]>("/customers") }
  // … die restlichen sechs analog, echte Pfade laut CoTraS-Doku
}
```

Endpunkt-Pfade, Auth-Verfahren (Bearer? API-Key-Header?), Paginierung und
Delta-Parameter (`?updatedSince=`) stehen im
[Anforderungskatalog](../../../../docs/plans/2026-07-03-cotras-api-anforderungskatalog.md)
bzw. der finalen CoTraS-Doku. Falls die gelieferten **Feldnamen** vom Katalog
abweichen, nur die Mapper in `map.ts` anpassen — Engine und DB bleiben unberührt
(der komplette Rohdatensatz landet ohnehin in Spalte `raw`).

### 2. In `client.ts` auf den echten Adapter umschalten

`getErpAdapter()` liest dann `erp_connection` (Base-URL, entschlüsselter
API-Key, `enabled`) und gibt bei `enabled = true` den `CotrasHttpAdapter`
zurück, sonst weiter den Mock:

```ts
export async function getErpAdapter(): Promise<CotrasAdapter> {
  const db = createRawAdminClient()
  const { data } = await db.from("erp_connection").select("base_url, api_key_cipher, enabled").eq("id", 1).single()
  if (data?.enabled && data.base_url && data.api_key_cipher) {
    return new CotrasHttpAdapter(data.base_url, decryptSecret(data.api_key_cipher))
  }
  return new MockCotrasAdapter()
}
```

> `getErpAdapter()` wird damit `async` — der einzige Aufrufer ist `runErpSync()`
> in `sync.ts` (`const adapter = await getErpAdapter()`). Sonst ändert sich nichts.

Danach im Backoffice unter **/admin/erp** Base-URL + API-Key eintragen, „Echte
Schnittstelle aktiv" anhaken, speichern — fertig. „Sync starten" und
„Kunden-Abgleich starten" tun dann dasselbe wie heute, nur gegen echte Daten.

## Designprinzipien (warum das so trägt)

- **Spiegel-first:** Alles landet zuerst in `erp_*`-Tabellen. Portal-Reads gehen
  nie live gegen das ERP → kein Ausfallrisiko, keine Latenz beim Kunden.
- **`raw` jsonb = Wahrheit:** Vollständiges ERP-Objekt pro Zeile. Mapping darf
  sich ändern, ohne Schema-Migration.
- **Hash-Diff:** Nur geänderte Zeilen (`content_hash`) werden geschrieben; Sync
  ist idempotent und günstig, mehrfaches Laufen ist folgenlos.
- **Tombstones statt Hard-Delete:** Im ERP entfernte Sätze werden
  `is_deleted = true`, nie gelöscht (Referenz-Integrität, Nachvollziehbarkeit).
- **Läufe/Fehler protokolliert:** Jeder Sync schreibt `sync_runs`, jeder
  Einzelfehler `sync_errors` — im Admin sichtbar.
- **Konservatives Matching:** Auto-Verknüpfung nur bei eindeutigem, verifiziertem
  E-Mail-Treffer. Alles andere geht in die manuelle Freigabe-Queue.
- **RLS strikt:** Alle `erp_*`/Sync-/Link-Tabellen sind staff/service_role-only,
  nie `anon`/`authenticated`-lesbar.

## Verifikation

Die Engine wurde end-to-end gegen die lokale Supabase getestet
(`erp-smoke.mts`, Wegwerf-Skript): Erstlauf-Inserts, Idempotenz beim Zweitlauf,
Tombstoning eines entfernten Satzes und Auto-Link per eindeutiger E-Mail. Der
Sync ist im Backoffice unter **/admin/erp** manuell auslösbar; eine zeitgesteuerte
Ausführung (Cron/Route) kann später ergänzt werden.
