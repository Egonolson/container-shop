"use client"
import { useEffect, useState } from "react"
import { medusa } from "@/lib/medusa"
import { useCart } from "@/lib/cart"
import { PublicShell } from "@/components/public/public-shell"
import { ProductCatalogSection, HAZARDOUS_WASTE_TYPES } from "@/components/public/catalog"
import { CartToast } from "@/components/public/cart-toast"
import { Button } from "@/components/ui/button"
import {
  Truck,
  Recycle,
  ShieldCheck,
  ArrowDown,
  AlertTriangle,
  Package,
  CalendarCheck,
  ClipboardCheck,
  Phone,
  Users,
  Star,
} from "lucide-react"

// Abfallarten für die Marketing-Übersicht
const wasteTypes = [
  "Bauschutt", "Erdaushub", "Grünschnitt", "Holz", "Sperrmüll", "Mischmüll",
  "Dachpappe", "Styropor", "Dämmwolle", "Gipskarton", "Gasbeton",
  "Bau- und Abbruchholz", "Papier & Pappe", "Gewerbeabfall",
]
const hazardousTypes = [...HAZARDOUS_WASTE_TYPES]

const steps = [
  { icon: Package, title: "Container wählen", text: "Größe und Abfallart auswählen" },
  { icon: CalendarCheck, title: "Termin abstimmen", text: "Wunschtermin für Lieferung angeben" },
  { icon: Truck, title: "Container befüllen", text: "Wir liefern, Sie befüllen" },
  { icon: ClipboardCheck, title: "Wir entsorgen", text: "Abholung und fachgerechte Entsorgung" },
]

const stats = [
  { value: "2.500+", label: "Zufriedene Kunden", icon: Users },
  { value: "18", label: "Fahrzeuge", icon: Truck },
  { value: "50+", label: "Jahre Erfahrung", icon: Star },
  { value: "24h", label: "Lieferzeit", icon: CalendarCheck },
]

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const [addedVariant, setAddedVariant] = useState<string | null>(null)
  const [toast, setToast] = useState<{ title: string; variant: string; visible: boolean }>({
    title: "", variant: "", visible: false,
  })

  useEffect(() => {
    medusa.store.region.list({ limit: 1 })
      .then(({ regions }) => {
        const regionId = regions?.[0]?.id
        return medusa.store.product.list({
          limit: 50,
          fields: "+variants.calculated_price",
          ...(regionId ? { region_id: regionId } : {}),
        })
      })
      .then(({ products }) => setProducts(products))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAddToCart = (product: any, variant: any) => {
    const price = variant.calculated_price?.calculated_amount
      ?? variant.prices?.[0]?.amount
      ?? 0
    addItem({
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      variantTitle: variant.title || "Standard",
      price,
      quantity: 1,
    })
    setAddedVariant(variant.id)
    setToast({ title: product.title, variant: variant.title || "Standard", visible: true })
    setTimeout(() => setAddedVariant(null), 1500)
  }

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative py-28 md:py-40 bg-seyfarth-navy overflow-hidden">
        {/* Diagonal stripe overlay for visual interest */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-40 top-0 w-[600px] h-full bg-seyfarth-blue/20 skew-x-[-12deg] origin-top-right" />
          <div className="absolute -right-20 top-0 w-[300px] h-full bg-seyfarth-yellow/5 skew-x-[-12deg] origin-top-right" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-seyfarth-orange font-semibold text-sm uppercase tracking-widest mb-4">
              Ihr zuverlässiger Servicepartner
            </p>
            <h1 className="font-headline text-5xl md:text-7xl text-white leading-tight">
              CONTAINER<br />
              <span className="text-seyfarth-yellow italic">BESTELLEN.</span>
            </h1>
            <p className="font-headline text-2xl md:text-3xl text-blue-200 italic mt-2">
              Einfach. Schnell. Zuverlässig.
            </p>
            <p className="mt-6 text-lg text-blue-100/80 max-w-2xl leading-relaxed">
              Absetz- und Abrollcontainer für Baustelle, Gewerbe und Privatprojekte.
              Fachgerechte Entsorgung aller Abfallarten — auch Gefahrstoffe.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Button
                className="bg-seyfarth-orange hover:bg-seyfarth-yellow hover:text-seyfarth-navy text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-seyfarth-orange/20"
                onClick={() => document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" })}
              >
                Container auswählen <ArrowDown className="h-4 w-4 ml-2" />
              </Button>
              <a href="tel:034491 5520-0">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-6 text-base font-semibold bg-transparent"
                >
                  <Phone className="h-4 w-4 mr-2" /> 034491 5520-0
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-7xl mx-auto px-6 mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-seyfarth-navy/80 px-6 py-5 text-center">
                <stat.icon className="h-5 w-5 text-seyfarth-yellow mx-auto mb-2" strokeWidth={1.5} />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-blue-300 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leistungen */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-seyfarth-navy italic">Unsere Leistungen</h2>
            <p className="mt-3 text-zinc-500">Alles aus einer Hand — von der Lieferung bis zur Entsorgung</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Truck,
                title: "Containerdienst",
                text: "Absetzer und Abroller in verschiedenen Größen. Lieferung und Abholung zum Wunschtermin.",
                color: "bg-seyfarth-blue",
              },
              {
                icon: Recycle,
                title: "Fachgerechte Entsorgung",
                text: "Zertifizierter Entsorgungsfachbetrieb. Bauschutt, Erdaushub, Grünschnitt, Sperrmüll und mehr.",
                color: "bg-seyfarth-navy",
              },
              {
                icon: ShieldCheck,
                title: "Gefahrstoff-Kompetenz",
                text: "Asbest, Dachpappe, KMF — wir entsorgen auch gefährliche Abfälle fachgerecht mit Nachweisführung.",
                color: "bg-seyfarth-orange",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`h-1.5 ${item.color}`} />
                <div className="p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-seyfarth-navy/5 mb-6 group-hover:bg-seyfarth-navy/10 transition-colors">
                    <item.icon className="h-7 w-7 text-seyfarth-navy" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-seyfarth-navy mb-2">{item.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Katalog */}
      <ProductCatalogSection
        products={products}
        loading={loading}
        onAddToCart={handleAddToCart}
        addedVariant={addedVariant}
      />

      {/* Abfallarten */}
      <section id="entsorgung" className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline text-3xl md:text-4xl text-seyfarth-navy italic">Wir entsorgen</h2>
            <p className="mt-3 text-zinc-500 text-lg">Fachgerechte Entsorgung für alle Abfallarten</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {wasteTypes.map((type) => (
              <span
                key={type}
                className="px-4 py-2 bg-white rounded-full text-sm text-zinc-700 border border-zinc-200 shadow-sm hover:border-seyfarth-blue hover:text-seyfarth-blue transition-colors"
              >
                {type}
              </span>
            ))}
            {hazardousTypes.map((type) => (
              <span
                key={type}
                className="px-4 py-2 bg-red-50 rounded-full text-sm text-red-700 border border-red-200 flex items-center gap-1.5 shadow-sm"
              >
                <AlertTriangle className="h-3 w-3" /> {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl text-seyfarth-navy italic">So funktioniert&apos;s</h2>
            <p className="mt-3 text-zinc-500">In 4 einfachen Schritten zum Container</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-seyfarth-navy/5 group-hover:bg-seyfarth-navy/10 transition-colors">
                    <step.icon className="h-7 w-7 text-seyfarth-navy" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-seyfarth-yellow text-seyfarth-navy text-xs font-bold shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 bg-seyfarth-navy relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 top-0 w-[400px] h-full bg-seyfarth-yellow/5 skew-x-[12deg] origin-top-left" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <ShieldCheck className="h-14 w-14 text-seyfarth-yellow mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-headline text-3xl md:text-5xl italic text-white mb-4">
            ZERTIFIZIERTER<br />
            <span className="text-seyfarth-yellow">ENTSORGUNGSFACHBETRIEB</span>
          </h2>
          <p className="text-blue-200 max-w-xl mx-auto mb-10 text-lg">
            Einsammeln, Befördern, Lagern, Behandeln und Verwerten von Abfällen
            gem. §56 KrWG. Wir übernehmen die fachgerechte Entsorgung für Sie.
          </p>
          <Button
            className="bg-seyfarth-yellow hover:bg-seyfarth-orange text-seyfarth-navy font-bold rounded-full px-10 py-6 text-base shadow-lg shadow-seyfarth-yellow/20"
            onClick={() => document.getElementById("katalog")?.scrollIntoView({ behavior: "smooth" })}
          >
            Jetzt Container bestellen
          </Button>
        </div>
      </section>
      <CartToast
        productTitle={toast.title}
        variantTitle={toast.variant}
        visible={toast.visible}
      />
    </PublicShell>
  )
}
