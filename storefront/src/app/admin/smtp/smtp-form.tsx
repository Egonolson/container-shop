"use client"

import { useActionState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { saveSmtpAction, sendTestMailAction, type SmtpFormState } from "./actions"

const INITIAL: SmtpFormState = { error: null, success: null }

type Settings = {
  host: string | null
  port: number
  secure: boolean
  username: string | null
  from_email: string | null
  from_name: string
  hasPassword: boolean
}

export function SmtpForm({ settings, defaultTestTo }: { settings: Settings; defaultTestTo: string }) {
  const [saveState, saveAction, saving] = useActionState<SmtpFormState, FormData>(saveSmtpAction, INITIAL)
  const [testState, testAction, testing] = useActionState<SmtpFormState, FormData>(sendTestMailAction, INITIAL)

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="host">SMTP-Host</Label>
            <Input id="host" name="host" defaultValue={settings.host ?? ""} placeholder="z. B. smtp-relay.brevo.com" />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1">
              <Label htmlFor="port">Port</Label>
              <Input id="port" name="port" type="number" defaultValue={settings.port} className="w-28" />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-zinc-600">
              <input type="checkbox" name="secure" defaultChecked={settings.secure} className="h-4 w-4 accent-seyfarth-blue" />
              TLS/SSL
            </label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="username">Benutzername</Label>
            <Input id="username" name="username" defaultValue={settings.username ?? ""} autoComplete="off" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Passwort {settings.hasPassword && <span className="text-xs text-emerald-600">(gesetzt)</span>}</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder={settings.hasPassword ? "Zum Ändern neu eingeben" : "SMTP-Passwort"} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fromEmail">Absender-E-Mail</Label>
            <Input id="fromEmail" name="fromEmail" type="email" defaultValue={settings.from_email ?? ""} placeholder="noreply@…" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fromName">Absender-Name</Label>
            <Input id="fromName" name="fromName" defaultValue={settings.from_name} />
          </div>
        </div>

        {saveState.error && <p className="text-sm text-destructive">{saveState.error}</p>}
        {saveState.success && <p className="text-sm text-emerald-600">{saveState.success}</p>}

        <Button type="submit" disabled={saving} className="bg-seyfarth-blue hover:bg-seyfarth-navy">
          {saving ? "Wird gespeichert …" : "Speichern"}
        </Button>
      </form>

      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
        <form action={testAction} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="testTo">Testmail an</Label>
            <Input id="testTo" name="testTo" type="email" defaultValue={defaultTestTo} className="w-64" />
          </div>
          <Button type="submit" variant="outline" disabled={testing}>
            {testing ? "Wird gesendet …" : "Testmail senden"}
          </Button>
        </form>
        {testState.error && <p className="mt-2 text-sm text-destructive">{testState.error}</p>}
        {testState.success && <p className="mt-2 text-sm text-emerald-600">{testState.success}</p>}
        <p className="mt-2 text-xs text-zinc-500">
          Speichern Sie zuerst, bevor Sie eine Testmail senden. Für die Registrierungs-Bestätigungsmails muss die
          Konfiguration zusätzlich auf den Auth-Dienst angewendet werden (Skript <code>sync-smtp-to-gotrue.sh</code>).
        </p>
      </div>
    </div>
  )
}
