"use client"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { customer, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !customer) router.push("/login")
  }, [loading, customer, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Laden...</div>
  if (!customer) return null

  return <>{children}</>
}
