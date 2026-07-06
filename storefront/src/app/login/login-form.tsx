"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { loginAction, type LoginFormState } from "./actions"

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, isPending] = useActionState<LoginFormState, FormData>(loginAction, {
    error: null,
    email: "",
  })

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-seyfarth-navy">Anmelden</CardTitle>
          <CardDescription>Für Privat- und Gewerbekunden mit Konto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" defaultValue={state.email} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={isPending} className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy">
              {isPending ? "Wird angemeldet …" : "Anmelden"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Noch kein Konto?{" "}
            <Link href="/registrieren" className="text-seyfarth-blue underline">
              Jetzt registrieren
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
