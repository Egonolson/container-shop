"use client"
import { Header } from "./header"
import { Footer } from "./footer"
import { CookieBanner } from "./cookie-banner"
import { ReactNode } from "react"

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </div>
  )
}
