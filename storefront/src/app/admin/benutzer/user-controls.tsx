"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { inviteStaffAction, changeRoleAction, revokeAccessAction, type UserActionState } from "./actions"

const INITIAL: UserActionState = { error: null, success: null }

export function InviteStaffForm() {
  const [state, action, pending] = useActionState<UserActionState, FormData>(inviteStaffAction, INITIAL)

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" name="email" type="email" required placeholder="kolleg.in@seyfarth.de" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Rolle</Label>
          <select
            id="role"
            name="role"
            defaultValue="staff"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-seyfarth-navy shadow-sm outline-none transition focus:border-seyfarth-blue focus:ring-4 focus:ring-seyfarth-blue/10"
          >
            <option value="staff">Mitarbeiter (staff)</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="firstName">Vorname</Label>
          <Input id="firstName" name="firstName" placeholder="optional" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lastName">Nachname</Label>
          <Input id="lastName" name="lastName" placeholder="optional" />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      {state.generatedPassword && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">Temporäres Passwort (nur jetzt sichtbar):</p>
          <p className="mt-1 font-mono text-sm">{state.generatedPassword}</p>
        </div>
      )}

      <Button type="submit" disabled={pending} className="bg-seyfarth-blue hover:bg-seyfarth-navy">
        {pending ? "Wird angelegt …" : "Konto anlegen"}
      </Button>
    </form>
  )
}

export function RoleForm({ id, currentRole }: { id: string; currentRole: string }) {
  const [state, action, pending] = useActionState<UserActionState, FormData>(changeRoleAction, INITIAL)
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-seyfarth-navy shadow-sm outline-none focus:border-seyfarth-blue"
      >
        <option value="staff">Mitarbeiter</option>
        <option value="admin">Admin</option>
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={pending} className="rounded-lg">
        {pending ? "…" : "Speichern"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  )
}

export function RevokeAccessButton({ id, email }: { id: string; email: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<UserActionState, FormData>(revokeAccessAction, INITIAL)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:text-destructive">
          Zugriff entziehen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zugriff entziehen?</DialogTitle>
          <DialogDescription>
            {email} verliert den Backoffice-Zugang und wird zu einem normalen Kundenkonto. Das Konto selbst bleibt bestehen.
          </DialogDescription>
        </DialogHeader>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={pending} variant="destructive">
              {pending ? "Wird entzogen …" : "Zugriff entziehen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
