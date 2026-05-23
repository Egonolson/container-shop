"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronDown, Mail, Menu, Phone, X } from "lucide-react"
import { useState } from "react"

const materialLinks = [
  { href: "/hilfe/bauschutt", label: "Bauschutt", text: "Was als Bauschutt zählt – und was nicht dazugehört." },
  { href: "/hilfe/baumischabfall", label: "Baumischabfall", text: "Für gemischte Bau- und Renovierungsabfälle." },
  { href: "/hilfe/gefaehrliche-stoffe", label: "Gefährliche Stoffe", text: "Sonderfälle bitte vorher klären lassen." },
  { href: "/hilfe/annahmebedingungen", label: "Annahmebedingungen", text: "Damit Abholung und Entsorgung ohne Überraschungen laufen." },
]

const helpLinks = [
  { href: "/hilfe", label: "Hilfe-Übersicht", text: "Alle Hinweise und häufigen Fragen auf einen Blick." },
  { href: "/hilfe/verpackung-befuellung", label: "Container richtig befüllen", text: "So wird der Container sicher befüllt und abgeholt." },
  { href: "/hilfe/oeffentliche-stellflaeche", label: "Container auf öffentlicher Fläche", text: "Was bei Straße, Gehweg oder Parkplatz wichtig ist." },
]

function NavDropdown({ label, links }: { label: string; links: Array<{ href: string; label: string; text: string }> }) {
  return (
    <div className="group relative">
      <button className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue" type="button">
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" strokeWidth={1.8} />
      </button>
      <div className="invisible absolute left-1/2 top-full w-[330px] -translate-x-1/2 pt-3 opacity-0 transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="rounded-2xl border border-zinc-100 bg-white p-3 shadow-[0_22px_55px_rgba(7,31,63,0.2)]">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-3 text-left transition-colors hover:bg-seyfarth-blue/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">
              <span className="block text-sm font-bold text-seyfarth-navy">{item.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{item.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="seyfarth-public-header sticky top-0 z-40 bg-transparent px-3 pt-3 md:px-4 md:pt-4">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between rounded-2xl border border-white/80 bg-white/95 px-4 shadow-[0_14px_34px_rgba(7,31,63,0.14)] backdrop-blur md:h-[88px] md:px-7 md:shadow-[0_18px_45px_rgba(7,31,63,0.18)]">
        <Link href="/" className="shrink-0" aria-label="Zur Startseite von Seyfarth">
          <Image src="/logo-seyfarth.png" alt="Seyfarth Container-Dienst GmbH" width={280} height={93} className="h-9 w-auto md:h-12" priority />
        </Link>

        <nav className="hidden items-center gap-4 md:flex lg:gap-5" aria-label="Hauptnavigation">
          <Link href="/#katalog" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">Container anfragen</Link>
          <NavDropdown label="Was darf rein?" links={materialLinks} />
          <NavDropdown label="Hilfe & Fragen" links={helpLinks} />
          <a href="#kontakt" className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-seyfarth-navy transition-colors hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue">Kontakt</a>
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild className="hidden rounded-[14px] bg-seyfarth-blue px-5 py-6 text-sm font-bold text-white shadow-[0_12px_28px_rgba(31,123,255,0.28)] hover:bg-seyfarth-navy sm:inline-flex">
            <Link href="/#katalog">Anfrage starten</Link>
          </Button>
          <button className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-seyfarth-navy hover:text-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue md:hidden" aria-label="Menü öffnen oder schließen" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mx-auto mt-2 max-w-[1180px] space-y-4 rounded-2xl border border-zinc-100 bg-white px-6 py-5 shadow-xl md:hidden">
          <Link href="/#katalog" className="block rounded-xl bg-seyfarth-blue px-4 py-3 text-sm font-bold text-white" onClick={() => setMobileMenuOpen(false)}>Container anfragen</Link>

          <div className="border-t border-zinc-100 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-seyfarth-blue">Was darf rein?</p>
            <div className="space-y-1">
              {materialLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg py-2 text-sm font-semibold text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-seyfarth-blue">Hilfe & Fragen</p>
            <div className="space-y-1">
              {helpLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg py-2 text-sm font-semibold text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}>{item.label}</Link>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <a href="tel:03449155200" className="flex items-center gap-2 py-2 text-sm font-semibold text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}><Phone className="h-4 w-4" />034491 5520-0</a>
            <a href="mailto:info@containerdienst-seyfarth.de" className="flex items-center gap-2 py-2 text-sm font-semibold text-seyfarth-navy" onClick={() => setMobileMenuOpen(false)}><Mail className="h-4 w-4" />Nachricht schreiben</a>
          </div>
        </div>
      )}
    </header>
  )
}
