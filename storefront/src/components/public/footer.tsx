import Link from "next/link"
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-seyfarth-navy text-blue-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Branding */}
          <div className="md:col-span-1 space-y-4">
            <div>
              <h2 className="font-headline text-xl text-white italic">SEYFARTH</h2>
              <p className="text-xs text-blue-300 tracking-widest uppercase mt-0.5">Container-Dienst</p>
            </div>
            <p className="text-sm text-blue-300/70 leading-relaxed">
              Ihr zuverlässiger Partner für Containerservice und fachgerechte Entsorgung seit über 50 Jahren.
            </p>
          </div>

          {/* Kontakt */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Kontakt</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-seyfarth-yellow" strokeWidth={1.5} />
                <span>Container-Dienst Seyfarth GmbH<br />Am Schreiber 1<br />04639 Ponitz</span>
              </div>
              <a href="tel:03449155200" className="flex items-center gap-3 hover:text-white transition-colors">
                <Phone className="h-4 w-4 shrink-0 text-seyfarth-yellow" strokeWidth={1.5} />
                <span>034491 5520-0</span>
              </a>
              <a href="mailto:info@containerdienst-seyfarth.de" className="flex items-center gap-3 hover:text-white transition-colors">
                <Mail className="h-4 w-4 shrink-0 text-seyfarth-yellow" strokeWidth={1.5} />
                <span>info@containerdienst-seyfarth.de</span>
              </a>
            </div>
          </div>

          {/* Rechtliches */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Rechtliches</h3>
            <div className="space-y-2 text-sm">
              <Link href="/impressum" className="block hover:text-white transition-colors py-0.5">Impressum</Link>
              <Link href="/datenschutz" className="block hover:text-white transition-colors py-0.5">Datenschutz</Link>
              <Link href="/agb" className="block hover:text-white transition-colors py-0.5">AGB</Link>
            </div>
          </div>

          {/* Zertifizierung */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Zertifizierung</h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <ShieldCheck className="h-6 w-6 text-seyfarth-yellow shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <span className="text-white font-medium block">Zertifizierter Entsorgungsfachbetrieb</span>
                  <span className="text-blue-300 text-xs">gem. §56 KrWG</span>
                </div>
              </div>
              <p className="text-xs text-blue-300/60 leading-relaxed">
                Einsammeln, Befördern, Lagern, Behandeln und Verwerten von Abfällen
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-blue-300/20 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-blue-300/40">
          <span>© {new Date().getFullYear()} Container-Dienst Seyfarth GmbH. Alle Rechte vorbehalten.</span>
          <span>Online-Portal powered by Vision X Digital</span>
        </div>
      </div>
    </footer>
  )
}
