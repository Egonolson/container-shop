"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { CustomerKind } from "@/lib/auth/validate-registration"
import { registerAction, type RegisterFormState } from "./actions"

const INITIAL_STATE: RegisterFormState = { errors: [], values: {} }

function errorFor(state: RegisterFormState, field: string) {
  return state.errors.find((e) => e.field === field)?.message
}

export default function RegistrierenPage() {
  const [state, formAction, isPending] = useActionState(registerAction, INITIAL_STATE)
  const [customerKind, setCustomerKind] = useState<CustomerKind | "">(
    (state.values.customerKind as CustomerKind) || "private",
  )

  const formError = errorFor(state, "form")

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-seyfarth-navy">Konto anlegen</CardTitle>
          <CardDescription>
            Privat- und Gewerbekunden können sich registrieren. Ohne Konto können Sie weiterhin{" "}
            <Link href="/#katalog" className="text-seyfarth-blue underline">
              als Gast anfragen
            </Link>
            .
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
              {(["private", "business"] as const).map((kind) => (
                <label
                  key={kind}
                  className={`flex min-h-10 cursor-pointer items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    customerKind === kind ? "bg-white text-seyfarth-navy shadow-sm" : "text-zinc-500"
                  }`}
                >
                  <input
                    type="radio"
                    name="customerKind"
                    value={kind}
                    checked={customerKind === kind}
                    onChange={() => setCustomerKind(kind)}
                    className="sr-only"
                  />
                  {kind === "private" ? "Privatkunde" : "Gewerbekunde"}
                </label>
              ))}
            </div>
            {errorFor(state, "customerKind") && (
              <p className="text-sm text-destructive">{errorFor(state, "customerKind")}</p>
            )}

            {customerKind === "private" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" name="firstName" defaultValue={state.values.firstName} required />
                  {errorFor(state, "firstName") && (
                    <p className="text-sm text-destructive">{errorFor(state, "firstName")}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" name="lastName" defaultValue={state.values.lastName} required />
                  {errorFor(state, "lastName") && (
                    <p className="text-sm text-destructive">{errorFor(state, "lastName")}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="companyName">Firmenname</Label>
                  <Input id="companyName" name="companyName" defaultValue={state.values.companyName} required />
                  {errorFor(state, "companyName") && (
                    <p className="text-sm text-destructive">{errorFor(state, "companyName")}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vatId">USt-IdNr. (optional)</Label>
                  <Input id="vatId" name="vatId" defaultValue={state.values.vatId} placeholder="DE123456789" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="phone">Telefon (optional)</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={state.values.phone} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" name="email" type="email" defaultValue={state.values.email} required />
              {errorFor(state, "email") && <p className="text-sm text-destructive">{errorFor(state, "email")}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" name="password" type="password" required minLength={8} />
              {errorFor(state, "password") && (
                <p className="text-sm text-destructive">{errorFor(state, "password")}</p>
              )}
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <Button type="submit" disabled={isPending} className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy">
              {isPending ? "Wird angelegt …" : "Konto anlegen"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Bereits registriert?{" "}
            <Link href="/login" className="text-seyfarth-blue underline">
              Anmelden
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
