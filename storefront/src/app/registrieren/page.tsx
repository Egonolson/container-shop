"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function RegisterForm() {
  const [companyName, setCompanyName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      return
    }
    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.")
      return
    }

    setSubmitting(true)
    try {
      await register(email, password, {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName || undefined,
      })
      router.push(redirect)
    } catch {
      setError("Registrierung fehlgeschlagen. Möglicherweise existiert bereits ein Konto mit dieser E-Mail.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm border-zinc-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-light">Konto erstellen</CardTitle>
        <p className="text-sm text-zinc-500">Registrieren Sie sich als Gewerbekunde</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="company">Firmenname</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Musterbau GmbH"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname *</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname *</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ihre@firma.de"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">Passwort bestätigen *</Label>
            <Input
              id="passwordConfirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
            disabled={submitting}
          >
            {submitting ? "Wird registriert..." : "Konto erstellen"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-zinc-500">
            Bereits ein Konto?{" "}
            <Link
              href={`/login${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-seyfarth-blue hover:text-seyfarth-navy font-medium"
            >
              Anmelden
            </Link>
          </p>
          <p className="text-sm">
            <Link href="/" className="text-zinc-400 hover:text-zinc-600 transition-colors">
              Zurück zum Katalog
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <PublicShell>
      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <Suspense fallback={<div className="text-zinc-400">Laden...</div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </PublicShell>
  )
}
