import { Metadata } from "next"
import { PublicShell } from "@/components/public/public-shell"

export const metadata: Metadata = {
  title: "Impressum | Seyfarth Container-Dienst",
}

export default function ImpressumPage() {
  return (
    <PublicShell>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-zinc max-w-none">
          <h1>Impressum</h1>

          <h2>Angaben gemaess SS 5 TMG</h2>

          <p>
            <strong>Seyfarth Container-Dienst</strong>
            <br />
            Inhaber: [Name]
            <br />
            [Strasse + Hausnummer]
            <br />
            [PLZ] Ponitz
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: [Telefonnummer]
            <br />
            E-Mail: [E-Mail-Adresse]
          </p>

          <h2>Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemaess SS 27a Umsatzsteuergesetz:
            <br />
            [USt-IdNr.]
          </p>

          <h2>Verantwortlich fuer den Inhalt nach SS 55 Abs. 2 RStV</h2>
          <p>
            [Name]
            <br />
            [Adresse]
          </p>

          <h2>Streitschlichtung</h2>
          <p>
            Die Europaeische Kommission stellt eine Plattform zur
            Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
          </p>
          <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
          <p>
            Wir sind nicht bereit oder verpflichtet, an
            Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>
      </div>
    </PublicShell>
  )
}
