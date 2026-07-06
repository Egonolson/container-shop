"use client"

import { useActionState } from "react"
import Link from "next/link"
import { LogIn } from "lucide-react"
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
    <section className="bg-zinc-50 py-16 md:py-24">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-[32px] border border-zinc-100 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-seyfarth-blue/10 text-seyfarth-blue">
              <LogIn className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Seyfarth Kundenportal</p>
            <h1 className="mt-3 font-headline text-3xl font-extrabold text-seyfarth-navy">Anmelden</h1>
            <p className="mt-3 text-sm text-zinc-600">Für Privat- und Gewerbekunden mit Konto.</p>
          </div>
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
            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy"
            >
              {isPending ? "Wird angemeldet …" : "Anmelden"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Noch kein Konto?{" "}
            <Link href="/registrieren" className="font-medium text-seyfarth-blue underline underline-offset-2">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
