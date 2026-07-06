"use client"

import { useActionState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { adminLoginAction, type AdminLoginFormState } from "./actions"

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<AdminLoginFormState, FormData>(adminLoginAction, {
    error: null,
    email: "",
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-seyfarth-navy/5 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-seyfarth-navy">Backoffice-Anmeldung</CardTitle>
          <CardDescription>Nur für Seyfarth-Mitarbeitende und VXD-Admins.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" defaultValue={state.email} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={isPending} className="w-full bg-seyfarth-navy hover:bg-seyfarth-blue">
              {isPending ? "Wird angemeldet …" : "Anmelden"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
