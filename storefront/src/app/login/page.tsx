"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      setError("Ungültige Anmeldedaten")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Container-Portal</CardTitle>
          <p className="text-center text-muted-foreground">Anmelden</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input id="password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Anmelden</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
