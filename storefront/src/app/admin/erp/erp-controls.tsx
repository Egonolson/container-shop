"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { saveErpConnectionAction, runSyncAction, runMatchAction, type ErpActionState } from "./actions"

const INITIAL: ErpActionState = { error: null, success: null }

export function ErpConnectionForm({ baseUrl, enabled, hasKey }: { baseUrl: string; enabled: boolean; hasKey: boolean }) {
  const [state, action, pending] = useActionState<ErpActionState, FormData>(saveErpConnectionAction, INITIAL)
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="baseUrl">ERP-Basis-URL (CoTraS REST)</Label>
        <Input id="baseUrl" name="baseUrl" defaultValue={baseUrl} placeholder="https://…/api/v1" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="apiKey">API-Key {hasKey && <span className="text-xs text-emerald-600">(gesetzt)</span>}</Label>
        <Input id="apiKey" name="apiKey" type="password" autoComplete="new-password" placeholder={hasKey ? "Zum Ändern neu eingeben" : "API-Key"} />
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" name="enabled" defaultChecked={enabled} className="h-4 w-4 accent-seyfarth-blue" />
        Echte Schnittstelle aktiv (aus = Mock-Daten)
      </label>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      <Button type="submit" disabled={pending} className="bg-seyfarth-blue hover:bg-seyfarth-navy">
        {pending ? "Wird gespeichert …" : "Verbindung speichern"}
      </Button>
    </form>
  )
}

export function ErpRunButtons() {
  const [syncState, syncAction, syncing] = useActionState<ErpActionState, FormData>(runSyncAction, INITIAL)
  const [matchState, matchAction, matching] = useActionState<ErpActionState, FormData>(runMatchAction, INITIAL)
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <form action={syncAction}>
          <Button type="submit" variant="outline" disabled={syncing}>
            {syncing ? "Sync läuft …" : "Sync starten"}
          </Button>
        </form>
        <form action={matchAction}>
          <Button type="submit" variant="outline" disabled={matching}>
            {matching ? "Abgleich läuft …" : "Kunden-Abgleich starten"}
          </Button>
        </form>
      </div>
      {(syncState.success || syncState.error) && <p className={syncState.error ? "text-sm text-destructive" : "text-sm text-emerald-600"}>{syncState.error ?? syncState.success}</p>}
      {(matchState.success || matchState.error) && <p className={matchState.error ? "text-sm text-destructive" : "text-sm text-emerald-600"}>{matchState.error ?? matchState.success}</p>}
    </div>
  )
}
