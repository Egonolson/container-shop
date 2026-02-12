"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

export function LocationForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", street: "", zip_code: "", city: "",
    contact_person: "", contact_phone: "", notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch(`${API_URL}/store/delivery-locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    })
    onSuccess()
  }

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Bezeichnung *</Label>
        <Input required value={form.name} onChange={(e) => update("name", e.target.value)}
          placeholder="z.B. Baustelle Hauptstr. 12" />
      </div>
      <div>
        <Label>Strasse *</Label>
        <Input required value={form.street} onChange={(e) => update("street", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label>PLZ *</Label>
          <Input required value={form.zip_code} onChange={(e) => update("zip_code", e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Ort *</Label>
          <Input required value={form.city} onChange={(e) => update("city", e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ansprechpartner</Label>
          <Input value={form.contact_person} onChange={(e) => update("contact_person", e.target.value)} />
        </div>
        <div>
          <Label>Telefon</Label>
          <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
        </div>
      </div>
      <div>
        <Label>Anmerkungen</Label>
        <Input value={form.notes} onChange={(e) => update("notes", e.target.value)}
          placeholder="z.B. Zufahrt über Hofeingang" />
      </div>
      <Button type="submit" className="w-full">Lieferort anlegen</Button>
    </form>
  )
}
