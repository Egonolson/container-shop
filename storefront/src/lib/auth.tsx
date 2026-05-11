"use client"
import { createContext, useContext, useState, ReactNode } from "react"

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

  const login = async () => {
    throw new Error("Kundenkonto-Anmeldung ist für öffentliche Anfragen aktuell nicht erforderlich. Bitte nutzen Sie den Anfrage-Konfigurator.")
  }

  const register = async () => {
    throw new Error("Registrierung ist für öffentliche Anfragen aktuell nicht erforderlich. Bitte nutzen Sie den Anfrage-Konfigurator.")
  }

  const logout = async () => {
    setCustomer(null)
  }

  const customerType: CustomerType = (customer?.metadata?.customer_type as CustomerType) || "b2b"

  return (
    <AuthContext.Provider value={{ customer, customerType, loading: false, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be inside AuthProvider")
  return ctx
}
