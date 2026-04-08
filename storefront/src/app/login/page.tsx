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

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      router.push(redirect)
    } catch {
      setError("Ungültige Anmeldedaten")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-sm border-zinc-200">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-light">Anmelden</CardTitle>
        <p className="text-sm text-zinc-500">Melden Sie sich in Ihrem Kundenkonto an</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
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
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-seyfarth-navy hover:bg-seyfarth-blue text-white rounded-full"
            disabled={submitting}
          >
            {submitting ? "Wird angemeldet..." : "Anmelden"}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-zinc-500">
            Noch kein Konto?{" "}
            <Link
              href={`/registrieren${redirect !== "/dashboard" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="text-seyfarth-blue hover:text-seyfarth-navy font-medium"
            >
              Jetzt registrieren
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

export default function LoginPage() {
  return (
    <PublicShell>
      <div className="flex-1 flex items-center justify-center py-16 px-6">
        <Suspense fallback={<div className="text-zinc-400">Laden...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </PublicShell>
  )
}
