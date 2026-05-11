import { Metadata } from "next"
import { PublicShell } from "@/components/public/public-shell"

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen | Seyfarth Container-Dienst",
}

export default function AGBPage() {
  return (
    <PublicShell>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-zinc max-w-none">
          <h1>Allgemeine Geschäftsbedingungen</h1>

          <p className="text-sm text-zinc-500 italic">
            Stand: [Datum] — Diese AGB werden derzeit erstellt und mit einem
            Rechtsanwalt abgestimmt.
          </p>

          <h2>SS 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle über den
            Onlineshop der Firma Seyfarth Container-Dienst geschlossenen
            Vertraege zwischen dem Betreiber und dem Kunden.
          </p>

          <h2>SS 2 Vertragspartner</h2>
          <p>[Platzhalter — wird mit Seyfarth/Anwalt abgestimmt]</p>

          <h2>SS 3 Vertragsgegenstand</h2>
          <p>[Platzhalter]</p>

          <h2>SS 4 Preise und Zahlung</h2>
          <p>[Platzhalter]</p>

          <h2>SS 5 Lieferung und Leistung</h2>
          <p>[Platzhalter]</p>

          <h2>SS 6 Haftung</h2>
          <p>[Platzhalter]</p>

          <h2>SS 7 Datenschutz</h2>
          <p>
            Die Datenschutzerklaerung ist unter{" "}
            <a href="/datenschutz">/datenschutz</a> einsehbar.
          </p>

          <h2>SS 8 Schlussbestimmungen</h2>
          <p>[Platzhalter]</p>
        </div>
      </div>
    </PublicShell>
  )
}
