"use client"
import { PublicShell } from "@/components/public/public-shell"
import { SeyfarthConfigurator } from "@/components/public/seyfarth-configurator"
import { Button } from "@/components/ui/button"
import {
  ArrowDown,
  AlertTriangle,
  CalendarCheck,
  ClipboardCheck,
  Package,
  Phone,
  Recycle,
  ShieldCheck,
  Star,
  Truck,
  Users,
} from "lucide-react"

const wasteTypes = [
  "Bauschutt", "Erdaushub", "Grünschnitt", "Holz", "Sperrmüll", "Mischmüll",
  "Dachpappe", "Styropor", "Dämmwolle", "Gipskarton", "Gasbeton", "Baumischabfall",
  "Papier & Pappe", "Gewerbeabfall",
]
const hazardousTypes = ["Asbest", "Mineralwolle / KMF", "teerhaltige Dachpappe", "kontaminierte Stoffe"]

const steps = [
  { icon: Package, title: "Leistung wählen", text: "Entsorgung, Baustoffe oder Transport" },
  { icon: CalendarCheck, title: "Zone prüfen", text: "PLZ und Ort bestimmen den Lieferanteil" },
  { icon: Truck, title: "Details angeben", text: "Containergröße, Stellplatz und Terminwunsch" },
  { icon: ClipboardCheck, title: "Wir prüfen", text: "Geprüfte Rückmeldung statt ungenauer Schätzung" },
]

const stats = [
  { value: "2.500+", label: "Zufriedene Kunden", icon: Users },
  { value: "18", label: "Fahrzeuge", icon: Truck },
  { value: "30+", label: "Jahre Erfahrung", icon: Star },
  { value: "Kostenlos", label: "Anfrage senden", icon: ClipboardCheck },
]

const faqs = [
  {
    question: "Entstehen Kosten, wenn ich eine Anfrage absende?",
    answer: "Nein. Das Absenden der Anfrage ist kostenlos. Seyfarth prüft Preis, Termin und Verfügbarkeit persönlich und meldet sich zur Bestätigung.",
  },
  {
    question: "Warum wird bei Entsorgung nach Gewicht abgerechnet?",
    answer: "Bei vielen Abfallarten hängt der endgültige Entsorgungspreis vom tatsächlichen Gewicht ab. Deshalb wird der Abfall verwogen und fair nach Menge berechnet.",
  },
  {
    question: "Was passiert bei Asbest, Mineralwolle oder Dachpappe?",
    answer: "Diese Abfälle sind prüfpflichtig. Seyfarth klärt Verpackung, Annahmebedingungen und die nächsten Schritte vorab persönlich mit Ihnen.",
  },
  {
    question: "Kann ein Container auf öffentlicher Fläche stehen?",
    answer: "Das ist grundsätzlich möglich, kann aber eine Genehmigung erfordern. Geben Sie die Stellfläche in der Anfrage an, damit Seyfarth die nächsten Schritte prüfen kann.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": "https://containerdienst-seyfarth.onepage.me/#business",
      name: "Seyfarth Container-Dienst",
      url: "https://containerdienst-seyfarth.onepage.me/",
      description: "Containerdienst, Entsorgung, Baustoffe und Transport mit persönlicher Anfrageprüfung.",
      areaServed: "Altenburger Land und Umgebung",
    },
    {
      "@type": "WebSite",
      "@id": "https://containerdienst-seyfarth.onepage.me/#website",
      name: "Seyfarth Container-Dienst",
      url: "https://containerdienst-seyfarth.onepage.me/",
    },
    {
      "@type": "Service",
      "@id": "https://containerdienst-seyfarth.onepage.me/#containerdienst",
      name: "Container online anfragen",
      serviceType: "Containerdienst, Entsorgung, Baustofflieferung und Transport",
      provider: { "@id": "https://containerdienst-seyfarth.onepage.me/#business" },
      areaServed: "Altenburger Land und Umgebung",
      description: "Anfrage für Container, Baustoffe oder Transport mit Prüfung von Ort, Abfallart, Containergröße, Stellplatz und Terminwunsch.",
    },
    {
      "@type": "FAQPage",
      "@id": "https://containerdienst-seyfarth.onepage.me/#faq",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
  ],
}

export default function HomePage() {
  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a href="#katalog" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-seyfarth-navy focus:shadow-lg">
        Direkt zur Anfrage springen
      </a>
      <section className="sey-brand-shell relative -mt-24 overflow-hidden pb-24 pt-40 md:-mt-28 md:pb-32 md:pt-56">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 top-0 h-full w-[620px] origin-top-right skew-x-[-12deg] bg-white/8" />
          <div className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-seyfarth-yellow">
              Containerdienst Seyfarth
            </p>
            <h1 className="font-headline text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-white md:text-7xl lg:text-8xl">
              Ihre Profis für<br />
              Entsorgung &amp;<br />
              <span className="text-seyfarth-yellow">Recycling.</span>
            </h1>
            <p className="mt-6 text-2xl font-semibold text-white md:text-3xl">
              Container einfach online anfragen.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/80">
              Ob Bauschutt, Sperrmüll, Grünschnitt, Holz oder Baustoffe: Stellen Sie Ihre Anfrage in wenigen Schritten. Wir prüfen Preis, Termin und Verfügbarkeit persönlich und melden uns mit allen wichtigen Hinweisen zurück. Die Anfrage ist kostenlos und unverbindlich.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                className="rounded-lg bg-[linear-gradient(135deg,#3A5BFF,#1F7BFF)] px-8 py-6 text-base font-bold text-white shadow-[0_16px_32px_rgba(31,123,255,0.35)] hover:bg-white hover:text-seyfarth-navy"
                onClick={() => document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" })}
              >
                Container anfragen <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
              <Button asChild variant="outline" className="rounded-lg border-white/20 bg-[#2D2D2D] px-8 py-6 text-base font-semibold text-white hover:bg-white/10">
                <a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" /> Beratung anrufen: 034491 5520-0</a>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-2xl shadow-black/10 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-seyfarth-navy/85 px-6 py-6 text-center backdrop-blur">
                <stat.icon className="mx-auto mb-2 h-5 w-5 text-seyfarth-yellow" strokeWidth={1.5} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="mt-0.5 text-xs text-blue-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F3F7FB] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <p className="sey-brand-badge mb-4">Container anfragen</p>
            <h2 className="font-headline text-4xl font-extrabold tracking-[-0.035em] text-seyfarth-navy md:text-6xl">Welchen <span className="text-seyfarth-yellow">Container</span> brauchen Sie?</h2>
            <p className="mt-3 text-zinc-500">Damit wir Ihnen ein realistisches Angebot machen können, fragen wir nur die wichtigsten Angaben ab: Ort, Abfallart, Containergröße, Stellplatz und Wunschtermin.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Truck, title: "Lieferort eingeben", text: "Ihre PLZ entscheidet mit, welche Transportkosten anfallen.", color: "bg-seyfarth-blue" },
              { icon: Recycle, title: "Preis nach Gewicht fair berechnet", text: "Bei Entsorgung wird der Abfall verwogen. Sie zahlen die Entsorgung nach tatsächlichem Gewicht – nicht nach Schätzung.", color: "bg-seyfarth-navy" },
              { icon: ShieldCheck, title: "Sonderfälle vorab klären", text: "Bei Asbest, Dämmwolle, Dachpappe oder öffentlicher Stellfläche prüfen wir vorab, was möglich ist und worauf Sie achten müssen.", color: "bg-seyfarth-orange" },
            ].map((item) => (
              <div key={item.title} className="group overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_20px_60px_rgba(7,31,63,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(7,31,63,0.14)]">
                <div className={`h-1.5 ${item.color}`} />
                <div className="p-8">
                  <div className="sey-yellow-icon mb-6 transition-transform group-hover:scale-105">
                    <item.icon className="h-7 w-7 text-seyfarth-navy" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-seyfarth-navy">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SeyfarthConfigurator />

      <section id="entsorgung" className="bg-[#F3F7FB] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-seyfarth-navy md:text-4xl">Wir entsorgen</h2>
            <p className="mt-3 text-lg text-zinc-500">Fachgerechte Entsorgung für viele Abfallarten, inklusive persönlicher Prüfung bei Sonderfällen</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {wasteTypes.map((type) => (
              <span key={type} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:border-seyfarth-blue hover:text-seyfarth-blue">{type}</span>
            ))}
            {hazardousTypes.map((type) => (
              <span key={type} className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-sm"><AlertTriangle className="h-3 w-3" /> {type}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-seyfarth-navy md:text-4xl">So funktioniert&apos;s</h2>
            <p className="mt-3 text-zinc-500">In vier einfachen Schritten zur unverbindlichen Anfrage</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <div key={item.title} className="group text-center">
                <div className="relative mb-6 inline-block">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-seyfarth-navy/5 transition-colors group-hover:bg-seyfarth-navy/10">
                    <item.icon className="h-7 w-7 text-seyfarth-navy" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -right-2 -top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-seyfarth-yellow text-xs font-bold text-seyfarth-navy shadow-md">{index + 1}</span>
                </div>
                <h3 className="mb-2 font-bold text-zinc-900">{item.title}</h3>
                <p className="text-sm text-zinc-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Häufige Fragen</p>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-seyfarth-navy md:text-4xl">Wichtige Hinweise vor Ihrer Anfrage</h2>
            <p className="mx-auto mt-3 max-w-2xl text-zinc-500">Damit Sie vor dem Absenden wissen, was passiert und wann Seyfarth persönlich prüft.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((item) => (
              <article key={item.question} className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-6">
                <h3 className="font-bold text-seyfarth-navy">{item.question}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-seyfarth-navy py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute -left-20 top-0 h-full w-[400px] origin-top-left skew-x-[12deg] bg-seyfarth-yellow/5" /></div>
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <ShieldCheck className="mx-auto mb-6 h-14 w-14 text-seyfarth-yellow" strokeWidth={1.5} />
          <h2 className="mb-4 font-headline text-3xl font-extrabold tracking-tight text-white md:text-5xl">Sie sind unsicher bei Abfallart oder Größe?</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-blue-100/80">Wenn Sie nicht genau wissen, welche Größe oder Abfallart passt: Rufen Sie uns an oder wählen Sie in der Anfrage „Ich bin unsicher“. Wir prüfen das persönlich mit Ihnen.</p>
          <Button asChild className="rounded-xl bg-seyfarth-yellow px-8 py-6 text-base font-bold text-seyfarth-navy hover:bg-white"><a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" /> Beratung anrufen: 034491 5520-0</a></Button>
        </div>
      </section>
    </PublicShell>
  )
}
