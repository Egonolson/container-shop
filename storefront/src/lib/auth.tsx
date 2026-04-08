"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { medusa } from "./medusa"

type CustomerType = "b2b" | "b2c"

interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  company_name?: string
  metadata?: Record<string, unknown>
}

interface RegisterData {
  first_name: string
  last_name: string
  company_name?: string
  customer_type?: CustomerType
}

interface AuthContextType {
  customer: Customer | null
  customerType: CustomerType
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, data: RegisterData) => Promise<void>
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

  const register = async (email: string, password: string, data: RegisterData) => {
    await medusa.auth.register("customer", "emailpass", { email, password })
    await medusa.auth.login("customer", "emailpass", { email, password })
    const { customer } = await medusa.store.customer.create({
      email,
      first_name: data.first_name,
      last_name: data.last_name,
      company_name: data.company_name,
      metadata: { customer_type: data.customer_type || "b2b" },
    })
    setCustomer(customer as any)
  }

  const logout = async () => {
    await medusa.auth.logout()
    setCustomer(null)
  }

  const customerType: CustomerType = (customer?.metadata?.customer_type as CustomerType) || "b2b"

  return (
    <AuthContext.Provider value={{ customer, customerType, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
