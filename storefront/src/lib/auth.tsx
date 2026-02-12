"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { medusa } from "./medusa"

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
}

interface AuthContextType {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    medusa.store.customer.retrieve()
      .then(({ customer }) => setCustomer(customer as any))
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    await medusa.auth.login("customer", "emailpass", { email, password })
    const { customer } = await medusa.store.customer.retrieve()
    setCustomer(customer as any)
  }

  const logout = async () => {
    await medusa.auth.logout()
    setCustomer(null)
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
