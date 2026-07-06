"use client"

import { useEffect, useState } from "react"
import { useActionState } from "react"
import { Archive, ArchiveRestore, MapPin, Pencil, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/supabase/types"
import {
  createSiteAction,
  updateSiteAction,
  setSiteArchivedAction,
  type SiteActionState,
} from "./sites-actions"

type Site = Database["public"]["Tables"]["construction_sites"]["Row"]

const INITIAL: SiteActionState = { error: null, success: false }

function addressLine(site: Site) {
  const line1 = [site.street, site.house_number].filter(Boolean).join(" ")
  const line2 = [site.postal_code, site.city].filter(Boolean).join(" ")
  return [line1, line2].filter(Boolean).join(", ") || "Keine Adresse hinterlegt"
}

function SiteForm({ site, onDone }: { site?: Site; onDone: () => void }) {
  const action = site ? updateSiteAction : createSiteAction
  const [state, formAction, isPending] = useActionState<SiteActionState, FormData>(action, INITIAL)

  useEffect(() => {
    if (state.success) onDone()
  }, [state.success, onDone])

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-seyfarth-blue/20 bg-seyfarth-blue/5 p-5">
      {site && <input type="hidden" name="id" value={site.id} />}
      <div className="space-y-1">
        <Label htmlFor="name">Bezeichnung der Baustelle / des Standorts</Label>
        <Input id="name" name="name" defaultValue={site?.name ?? ""} placeholder="z. B. Neubau Musterstraße" required />
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label htmlFor="street">Straße</Label>
          <Input id="street" name="street" defaultValue={site?.street ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="houseNumber">Nr.</Label>
          <Input id="houseNumber" name="houseNumber" className="w-20" defaultValue={site?.house_number ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="space-y-1">
          <Label htmlFor="postalCode">PLZ</Label>
          <Input id="postalCode" name="postalCode" className="w-24" defaultValue={site?.postal_code ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">Ort</Label>
          <Input id="city" name="city" defaultValue={site?.city ?? ""} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="contactName">Ansprechpartner vor Ort</Label>
          <Input id="contactName" name="contactName" defaultValue={site?.contact_name ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contactPhone">Telefon vor Ort</Label>
          <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={site?.contact_phone ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Hinweise (Zufahrt, Stellplatz …)</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={site?.notes ?? ""}
          className="min-h-20 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-seyfarth-navy shadow-sm outline-none transition focus:border-seyfarth-blue focus:ring-4 focus:ring-seyfarth-blue/10"
        />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending} className="rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy">
          {isPending ? "Wird gespeichert …" : site ? "Änderungen speichern" : "Baustelle anlegen"}
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={onDone}>
          Abbrechen
        </Button>
      </div>
    </form>
  )
}

function SiteCard({ site, onEdit }: { site: Site; onEdit: () => void }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
      <div>
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seyfarth-blue/10 text-seyfarth-blue">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-seyfarth-navy">{site.name}</p>
            <p className="text-sm text-zinc-500">{addressLine(site)}</p>
          </div>
        </div>
        {(site.contact_name || site.contact_phone) && (
          <p className="text-sm text-zinc-600">
            {[site.contact_name, site.contact_phone].filter(Boolean).join(" · ")}
          </p>
        )}
        {site.notes && <p className="mt-1 text-sm text-zinc-500">{site.notes}</p>}
      </div>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={onEdit}>
          <Pencil className="mr-2 h-3.5 w-3.5" />
          Bearbeiten
        </Button>
        <form action={setSiteArchivedAction}>
          <input type="hidden" name="id" value={site.id} />
          <input type="hidden" name="archived" value="true" />
          <Button type="submit" variant="ghost" size="sm" className="rounded-lg text-zinc-500">
            <Archive className="mr-2 h-3.5 w-3.5" />
            Archivieren
          </Button>
        </form>
      </div>
    </div>
  )
}

export function SitesManager({ sites }: { sites: Site[] }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const active = sites.filter((s) => !s.is_archived)
  const archived = sites.filter((s) => s.is_archived)

  return (
    <div className="space-y-5">
      {active.length === 0 && !adding && (
        <p className="text-sm text-zinc-500">
          Noch keine Baustellen angelegt. Legen Sie Ihre Standorte an, um bei der Anfrage nicht jedes Mal die Adresse neu einzugeben.
        </p>
      )}

      {active.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {active.map((site) =>
            editingId === site.id ? (
              <div key={site.id} className="md:col-span-2">
                <SiteForm site={site} onDone={() => setEditingId(null)} />
              </div>
            ) : (
              <SiteCard key={site.id} site={site} onEdit={() => setEditingId(site.id)} />
            ),
          )}
        </div>
      )}

      {adding ? (
        <SiteForm onDone={() => setAdding(false)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-dashed"
          onClick={() => {
            setEditingId(null)
            setAdding(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Neue Baustelle anlegen
        </Button>
      )}

      {archived.length > 0 && (
        <details className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
          <summary className="cursor-pointer text-sm font-medium text-zinc-600">
            Archivierte Baustellen ({archived.length})
          </summary>
          <div className="mt-3 space-y-2">
            {archived.map((site) => (
              <div key={site.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-600">{site.name}</p>
                  <p className="truncate text-xs text-zinc-400">{addressLine(site)}</p>
                </div>
                <form action={setSiteArchivedAction}>
                  <input type="hidden" name="id" value={site.id} />
                  <input type="hidden" name="archived" value="false" />
                  <Button type="submit" variant="ghost" size="sm" className="rounded-lg text-seyfarth-blue">
                    <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                    Wiederherstellen
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
