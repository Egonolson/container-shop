"use client"
import Link from "next/link"
import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardCheck, Phone } from "lucide-react"

export default function CheckoutPage() {
  return (
    <PublicShell>
      <section className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="rounded-[32px] border border-zinc-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-seyfarth-blue/10 text-seyfarth-blue">
              <ClipboardCheck className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Seyfarth Anfrage</p>
            <h1 className="mt-3 font-headline text-3xl font-extrabold text-seyfarth-navy md:text-4xl">Bitte starten Sie Ihre Anfrage im Seyfarth-Konfigurator.</h1>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
              Dort erfassen Sie Ort, Auswahl, Containergröße, Stellplatz und Terminwunsch. Seyfarth prüft Preis, Verfügbarkeit und wichtige Hinweise persönlich, bevor Kosten entstehen.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy"><Link href="/#katalog"><ArrowLeft className="mr-2 h-4 w-4" />Zur Anfrage</Link></Button>
              <Button asChild variant="outline" className="rounded-xl"><a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" />034491 5520-0</a></Button>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  )
}
