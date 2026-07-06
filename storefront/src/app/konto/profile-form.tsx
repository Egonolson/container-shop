"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { Database } from "@/lib/supabase/types"
import { updateProfileAction, type UpdateProfileState } from "./actions"

type Profile = Database["public"]["Tables"]["customer_profiles"]["Row"]

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, isPending] = useActionState<UpdateProfileState, FormData>(updateProfileAction, {
    error: null,
    success: false,
  })

  return (
    <form action={formAction} className="space-y-4">
      {profile.customer_kind === "private" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="firstName">Vorname</Label>
            <Input id="firstName" name="firstName" defaultValue={profile.first_name ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Nachname</Label>
            <Input id="lastName" name="lastName" defaultValue={profile.last_name ?? ""} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="companyName">Firmenname</Label>
            <Input id="companyName" name="companyName" defaultValue={profile.company_name ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="vatId">USt-IdNr.</Label>
            <Input id="vatId" name="vatId" defaultValue={profile.vat_id ?? ""} />
          </div>
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} />
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label htmlFor="street">Straße</Label>
          <Input id="street" name="street" defaultValue={profile.street ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="houseNumber">Nr.</Label>
          <Input id="houseNumber" name="houseNumber" className="w-20" defaultValue={profile.house_number ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="space-y-1">
          <Label htmlFor="postalCode">PLZ</Label>
          <Input id="postalCode" name="postalCode" className="w-24" defaultValue={profile.postal_code ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">Ort</Label>
          <Input id="city" name="city" defaultValue={profile.city ?? ""} />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">Gespeichert.</p>}

      <Button type="submit" disabled={isPending} className="bg-seyfarth-blue hover:bg-seyfarth-navy">
        {isPending ? "Wird gespeichert …" : "Speichern"}
      </Button>
    </form>
  )
}
