"use client"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useCart } from "@/lib/cart"
import { medusa } from "@/lib/medusa"
import { PublicShell } from "@/components/public/public-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Plus,
  Loader2,
  ShoppingCart,
  User,
  LogIn,
  UserPlus,
  Trash2,
  Lock,
} from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

type Step = "cart" | "account" | "location" | "compliance" | "details" | "confirm"
type CheckoutMode = "guest" | "authenticated" | null

function formatPrice(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

// Step indicator component
function StepIndicator({ steps, currentStep }: { steps: { key: Step; label: string }[]; currentStep: Step }) {
  const currentIdx = steps.findIndex((s) => s.key === currentStep)
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((s, i) => {
        const isActive = s.key === currentStep
        const isCompleted = i < currentIdx
        return (
          <div key={s.key} className="flex items-center shrink-0">
            {i > 0 && (
              <div className={`w-6 h-px mx-1 ${isCompleted ? "bg-seyfarth-blue" : "bg-zinc-200"}`} />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-seyfarth-blue text-white ring-4 ring-seyfarth-blue/20"
                    : isCompleted
                    ? "bg-seyfarth-blue text-white"
                    : "bg-zinc-100 text-zinc-400"
                }`}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive ? "text-seyfarth-navy" : isCompleted ? "text-seyfarth-blue" : "text-zinc-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { customer, loading: authLoading, login, register } = useAuth()
  const { items, removeItem, clearCart, total, itemCount } = useCart()

  const [step, setStep] = useState<Step>("cart")
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(false)

  // Product details (fetched to get metadata like avv_number, is_hazardous)
  const [productDetails, setProductDetails] = useState<Record<string, any>>({})

  // Guest info
  const [guestFirstName, setGuestFirstName] = useState("")
  const [guestLastName, setGuestLastName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestCompany, setGuestCompany] = useState("")
  const [guestPhone, setGuestPhone] = useState("")

  // Inline login/register
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState("")
  const [authFirstName, setAuthFirstName] = useState("")
  const [authLastName, setAuthLastName] = useState("")
  const [authCompany, setAuthCompany] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSubmitting, setAuthSubmitting] = useState(false)

  // Selection state
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [orderType, setOrderType] = useState("stellen")
  const [desiredDate, setDesiredDate] = useState("")
  const [notes, setNotes] = useState("")

  // Guest location (manual entry)
  const [guestLocation, setGuestLocation] = useState({ name: "", street: "", zip_code: "", city: "" })

  // Compliance state
  const [gewabfvJustificationType, setGewabfvJustificationType] = useState("")
  const [gewabfvJustificationText, setGewabfvJustificationText] = useState("")
  const [erzeugerNummer, setErzeugerNummer] = useState("")
  const [vollmachtAccepted, setVollmachtAccepted] = useState(false)
  const [legalConfirmed, setLegalConfirmed] = useState(false)

  // New location form (for authenticated users)
  const [showNewLocation, setShowNewLocation] = useState(false)
  const [newLocation, setNewLocation] = useState({ name: "", street: "", zip_code: "", city: "" })
  const [locationSaving, setLocationSaving] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-detect mode when customer is already logged in
  useEffect(() => {
    if (!authLoading && customer && !checkoutMode) {
      setCheckoutMode("authenticated")
    }
  }, [authLoading, customer, checkoutMode])

  // Load locations when authenticated
  useEffect(() => {
    if (!customer) return
    setDataLoading(true)
    fetch(`${API_URL}/store/delivery-locations`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setLocations(d.delivery_locations || []))
      .finally(() => setDataLoading(false))
  }, [customer])

  // Fetch product details (metadata) for items in cart
  useEffect(() => {
    if (items.length === 0) return
    const productIds = [...new Set(items.map((i) => i.productId))]
    const missing = productIds.filter((id) => !productDetails[id])
    if (missing.length === 0) return

    Promise.all(
      missing.map((id) =>
        medusa.store.product
          .retrieve(id)
          .then(({ product }) => ({ id, product }))
          .catch(() => null)
      )
    ).then((results) => {
      const newDetails: Record<string, any> = { ...productDetails }
      for (const r of results) {
        if (r) newDetails[r.id] = r.product
      }
      setProductDetails(newDetails)
    })
  }, [items, productDetails])

  // Empty cart guard
  useEffect(() => {
    if (itemCount === 0 && step !== "cart") {
      router.push("/")
    }
  }, [itemCount, step, router])

  const isAuthenticated = checkoutMode === "authenticated" && !!customer
  const isGuest = checkoutMode === "guest"

  // Derive compliance requirements from products in cart
  const complianceInfo = useMemo(() => {
    let requiresGewabfv = false
    let hasHazardous = false
    let requiresTrgs519 = false
    const avvNumbers: string[] = []

    for (const item of items) {
      const product = productDetails[item.productId]
      if (!product?.metadata) continue
      const meta = product.metadata
      if (meta.requires_gewabfv_declaration) requiresGewabfv = true
      if (meta.is_hazardous) hasHazardous = true
      if (meta.requires_trgs519) requiresTrgs519 = true
      if (meta.avv_number && !avvNumbers.includes(meta.avv_number)) {
        avvNumbers.push(meta.avv_number)
      }
    }

    return { requiresGewabfv, hasHazardous, requiresTrgs519, avvNumbers }
  }, [items, productDetails])

  const needsCompliance = complianceInfo.requiresGewabfv || complianceInfo.hasHazardous
  const complianceRequiresLogin = needsCompliance && isGuest

  const visibleSteps: { key: Step; label: string }[] = [
    { key: "cart", label: "Warenkorb" },
    { key: "account", label: "Konto" },
    { key: "location", label: "Lieferort" },
    ...(needsCompliance ? [{ key: "compliance" as Step, label: "Pflichten" }] : []),
    { key: "details", label: "Details" },
    { key: "confirm", label: "Bestätigen" },
  ]

  const getNextStep = (current: Step): Step | null => {
    const keys = visibleSteps.map((s) => s.key)
    const idx = keys.indexOf(current)
    if (idx < keys.length - 1) return keys[idx + 1]
    return null
  }

  const getPrevStep = (current: Step): Step | null => {
    const keys = visibleSteps.map((s) => s.key)
    const idx = keys.indexOf(current)
    if (idx > 0) return keys[idx - 1]
    return null
  }

  const canProceed = (): boolean => {
    switch (step) {
      case "cart":
        return items.length > 0
      case "account":
        if (isAuthenticated) return true
        if (isGuest) return !!(guestFirstName && guestLastName && guestEmail)
        return false
      case "location":
        if (isAuthenticated) return !!selectedLocation
        if (isGuest) return !!(guestLocation.street && guestLocation.zip_code && guestLocation.city)
        return false
      case "compliance":
        if (complianceRequiresLogin) return false
        if (complianceInfo.requiresGewabfv && !gewabfvJustificationType) return false
        if (complianceInfo.hasHazardous && (!erzeugerNummer || !vollmachtAccepted)) return false
        return true
      case "details":
        return true
      case "confirm":
        return legalConfirmed
      default:
        return false
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    setAuthSubmitting(true)
    try {
      await login(authEmail, authPassword)
      setCheckoutMode("authenticated")
    } catch {
      setAuthError("Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.")
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError("")
    if (authPassword.length < 8) {
      setAuthError("Das Passwort muss mindestens 8 Zeichen lang sein.")
      return
    }
    if (authPassword !== authPasswordConfirm) {
      setAuthError("Die Passwörter stimmen nicht überein.")
      return
    }
    setAuthSubmitting(true)
    try {
      await register(authEmail, authPassword, {
        first_name: authFirstName,
        last_name: authLastName,
        company_name: authCompany || undefined,
      })
      setCheckoutMode("authenticated")
    } catch {
      setAuthError("Registrierung fehlgeschlagen. Möglicherweise existiert bereits ein Konto.")
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleCreateLocation = async () => {
    setLocationSaving(true)
    try {
      const res = await fetch(`${API_URL}/store/delivery-locations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newLocation),
      })
      const data = await res.json()
      if (data.delivery_location) {
        setLocations((prev) => [...prev, data.delivery_location])
        setSelectedLocation(data.delivery_location)
        setShowNewLocation(false)
        setNewLocation({ name: "", street: "", zip_code: "", city: "" })
      }
    } catch {
      // silently fail
    } finally {
      setLocationSaving(false)
    }
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setError(null)
    try {
      // Submit GewAbfV declaration if needed
      if (complianceInfo.requiresGewabfv && isAuthenticated && selectedLocation) {
        for (const avv of complianceInfo.avvNumbers) {
          await fetch(`${API_URL}/store/gewabfv-declarations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              delivery_location_id: selectedLocation.id,
              avv_number: avv,
              is_separated: false,
              justification_type: gewabfvJustificationType,
              justification_text: gewabfvJustificationText || gewabfvJustificationType,
            }),
          })
        }
      }

      // Create Medusa cart
      const { cart } = await medusa.store.cart.create({})

      // Add line items
      for (const item of items) {
        await medusa.store.cart.createLineItem(cart.id, {
          variant_id: item.variantId,
          quantity: item.quantity,
        })
      }

      // Determine location info
      const locationInfo = isAuthenticated
        ? {
            delivery_location_id: selectedLocation?.id,
            delivery_location_name: selectedLocation?.name,
          }
        : {
            delivery_location_name: guestLocation.name || `${guestLocation.street}, ${guestLocation.city}`,
            delivery_location_street: guestLocation.street,
            delivery_location_zip: guestLocation.zip_code,
            delivery_location_city: guestLocation.city,
          }

      // Guest info
      const guestInfo = isGuest
        ? {
            guest_first_name: guestFirstName,
            guest_last_name: guestLastName,
            guest_email: guestEmail,
            guest_company: guestCompany,
            guest_phone: guestPhone,
          }
        : {}

      // Attach metadata
      await medusa.store.cart.update(cart.id, {
        metadata: {
          ...locationInfo,
          ...guestInfo,
          checkout_mode: checkoutMode,
          order_type: orderType,
          desired_date: desiredDate,
          avv_numbers: complianceInfo.avvNumbers,
          has_hazardous: complianceInfo.hasHazardous,
          erzeuger_nummer: erzeugerNummer || undefined,
          notes,
        },
      })

      // Create delivery schedule if date requested (only for authenticated)
      if (desiredDate && isAuthenticated) {
        await fetch(`${API_URL}/store/delivery-schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ requested_date: desiredDate }),
        })
      }

      clearCart()
      router.push("/checkout/success")
    } catch (e) {
      console.error("Order creation failed:", e)
      setError("Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.")
      setSubmitting(false)
    }
  }

  // Get product waste info for display
  const getProductWasteInfo = (productId: string) => {
    const product = productDetails[productId]
    if (!product?.metadata) return null
    return {
      avvNumber: product.metadata.avv_number as string | undefined,
      isHazardous: product.metadata.is_hazardous as boolean | undefined,
      wasteTitle: product.metadata.waste_title as string | undefined,
    }
  }

  if (authLoading) {
    return (
      <PublicShell>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
        </div>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-seyfarth-navy mb-6">Bestellung aufgeben</h1>
          <StepIndicator steps={visibleSteps} currentStep={step} />
        </div>

        {/* ───────── Step: Cart Review ───────── */}
        {step === "cart" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingCart className="h-5 w-5 text-seyfarth-blue" strokeWidth={1.5} />
                  <h2 className="text-lg font-semibold text-zinc-900">Warenkorb prüfen</h2>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-zinc-200 mx-auto mb-4" strokeWidth={1} />
                    <p className="text-zinc-500 mb-4">Ihr Warenkorb ist leer.</p>
                    <Button variant="outline" asChild className="rounded-full">
                      <Link href="/#katalog">Zum Katalog</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const wasteInfo = getProductWasteInfo(item.productId)
                      return (
                        <div
                          key={item.id}
                          className={`p-4 rounded-xl border transition-all ${
                            wasteInfo?.isHazardous
                              ? "bg-red-50/50 border-red-200 border-l-4 border-l-red-500"
                              : "bg-zinc-50/80 border-zinc-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm text-zinc-900">{item.productTitle}</p>
                                {wasteInfo?.isHazardous && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                    <ShieldAlert className="h-3 w-3 mr-0.5" /> Gefährlich
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">{item.variantTitle}</p>
                              {wasteInfo?.avvNumber && (
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  AVV {wasteInfo.avvNumber}
                                  {wasteInfo.wasteTitle && ` — ${wasteInfo.wasteTitle}`}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="font-semibold text-sm text-zinc-900">
                                {formatPrice(item.price)}
                              </span>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Compliance hints in cart */}
                    {complianceInfo.hasHazardous && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-red-800">Gefährlicher Abfall im Warenkorb</p>
                          <p className="text-red-700 mt-0.5">
                            Für die Entsorgung sind zusätzliche Angaben (Erzeugernummer, eANV-Vollmacht)
                            erforderlich. Diese werden im Bestellprozess abgefragt.
                          </p>
                        </div>
                      </div>
                    )}
                    {complianceInfo.requiresGewabfv && !complianceInfo.hasHazardous && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800">GewAbfV-Erklärung erforderlich</p>
                          <p className="text-amber-700 mt-0.5">
                            Für gemischte Gewerbeabfälle wird im Bestellprozess eine Begründung abgefragt.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                      <span className="text-sm text-zinc-500">Gesamtsumme</span>
                      <span className="text-xl font-bold text-seyfarth-navy">{formatPrice(total)}</span>
                    </div>

                    <p className="text-xs text-zinc-400 pt-1">
                      <Link
                        href="/#katalog"
                        className="hover:text-seyfarth-blue underline transition-colors"
                      >
                        Weitere Container hinzufügen
                      </Link>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────── Step: Account ───────── */}
        {step === "account" && (
          <div className="space-y-4">
            {/* Already logged in */}
            {isAuthenticated && customer && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-seyfarth-blue/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-seyfarth-blue" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-zinc-900">
                        {customer.first_name} {customer.last_name}
                      </p>
                      <p className="text-sm text-zinc-500">{customer.email}</p>
                      {customer.company_name && (
                        <p className="text-sm text-zinc-500">{customer.company_name}</p>
                      )}
                    </div>
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Angemeldet
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Not yet decided or guest */}
            {!isAuthenticated && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Guest Option */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isGuest ? "ring-2 ring-seyfarth-blue border-seyfarth-blue" : "hover:border-zinc-300"
                    }`}
                    onClick={() => setCheckoutMode("guest")}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4">
                        <User className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-semibold text-zinc-900 mb-1">Als Gast bestellen</h3>
                      <p className="text-sm text-zinc-500">
                        Schnelle Bestellung ohne Konto. Für einfache Entsorgungsaufträge.
                      </p>
                      {needsCompliance && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center justify-center gap-1">
                          <Lock className="h-3 w-3" /> Eingeschränkt bei Pflichtdokumenten
                        </p>
                      )}
                      {isGuest && (
                        <Badge className="mt-3 bg-seyfarth-blue/10 text-seyfarth-blue border-0">
                          <Check className="h-3 w-3 mr-1" /> Ausgewählt
                        </Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Login Option */}
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      checkoutMode === null
                        ? "hover:border-zinc-300"
                        : "hover:border-zinc-300"
                    }`}
                    onClick={() => {
                      setCheckoutMode(null)
                      setAuthMode("login")
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-seyfarth-blue/10 flex items-center justify-center mx-auto mb-4">
                        <LogIn className="h-6 w-6 text-seyfarth-blue" strokeWidth={1.5} />
                      </div>
                      <h3 className="font-semibold text-zinc-900 mb-1">Anmelden</h3>
                      <p className="text-sm text-zinc-500">
                        Gespeicherte Lieferorte, Auftragshistorie und Compliance-Dokumente.
                      </p>
                      {needsCompliance && (
                        <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                          <Check className="h-3 w-3" /> Empfohlen für Ihren Warenkorb
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Guest Form */}
                {isGuest && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="font-semibold text-zinc-900">Ihre Kontaktdaten</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="guestFirstName" className="text-xs">
                            Vorname *
                          </Label>
                          <Input
                            id="guestFirstName"
                            value={guestFirstName}
                            onChange={(e) => setGuestFirstName(e.target.value)}
                            placeholder="Max"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="guestLastName" className="text-xs">
                            Nachname *
                          </Label>
                          <Input
                            id="guestLastName"
                            value={guestLastName}
                            onChange={(e) => setGuestLastName(e.target.value)}
                            placeholder="Mustermann"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="guestEmail" className="text-xs">
                          E-Mail *
                        </Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="ihre@firma.de"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="guestCompany" className="text-xs">
                            Firma
                          </Label>
                          <Input
                            id="guestCompany"
                            value={guestCompany}
                            onChange={(e) => setGuestCompany(e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="guestPhone" className="text-xs">
                            Telefon
                          </Label>
                          <Input
                            id="guestPhone"
                            type="tel"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Inline Login/Register Form */}
                {!isGuest && (
                  <Card>
                    <CardContent className="p-6">
                      {/* Tabs */}
                      <div className="flex border-b border-zinc-200 mb-6">
                        <button
                          onClick={() => setAuthMode("login")}
                          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            authMode === "login"
                              ? "border-seyfarth-blue text-seyfarth-blue"
                              : "border-transparent text-zinc-500 hover:text-zinc-700"
                          }`}
                        >
                          <LogIn className="h-4 w-4 inline mr-2" />
                          Anmelden
                        </button>
                        <button
                          onClick={() => setAuthMode("register")}
                          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                            authMode === "register"
                              ? "border-seyfarth-blue text-seyfarth-blue"
                              : "border-transparent text-zinc-500 hover:text-zinc-700"
                          }`}
                        >
                          <UserPlus className="h-4 w-4 inline mr-2" />
                          Registrieren
                        </button>
                      </div>

                      {authError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                          {authError}
                        </div>
                      )}

                      {authMode === "login" ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="loginEmail" className="text-xs">
                              E-Mail
                            </Label>
                            <Input
                              id="loginEmail"
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="ihre@firma.de"
                              required
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="loginPassword" className="text-xs">
                              Passwort
                            </Label>
                            <Input
                              id="loginPassword"
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={authSubmitting}
                            className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
                          >
                            {authSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird angemeldet...
                              </>
                            ) : (
                              "Anmelden"
                            )}
                          </Button>
                        </form>
                      ) : (
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Vorname *</Label>
                              <Input
                                value={authFirstName}
                                onChange={(e) => setAuthFirstName(e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Nachname *</Label>
                              <Input
                                value={authLastName}
                                onChange={(e) => setAuthLastName(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Firma</Label>
                            <Input
                              value={authCompany}
                              onChange={(e) => setAuthCompany(e.target.value)}
                              placeholder="Optional"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">E-Mail *</Label>
                            <Input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Passwort *</Label>
                              <Input
                                type="password"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                placeholder="Min. 8 Zeichen"
                                required
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Bestätigen *</Label>
                              <Input
                                type="password"
                                value={authPasswordConfirm}
                                onChange={(e) => setAuthPasswordConfirm(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                          <Button
                            type="submit"
                            disabled={authSubmitting}
                            className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
                          >
                            {authSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird registriert...
                              </>
                            ) : (
                              "Konto erstellen & fortfahren"
                            )}
                          </Button>
                        </form>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ───────── Step: Location ───────── */}
        {step === "location" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="h-5 w-5 text-seyfarth-blue" strokeWidth={1.5} />
                <h2 className="text-lg font-semibold text-zinc-900">Lieferort</h2>
              </div>

              {isAuthenticated ? (
                <>
                  {dataLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                    </div>
                  ) : (
                    <>
                      {locations.map((loc: any) => (
                        <div
                          key={loc.id}
                          onClick={() => setSelectedLocation(loc)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selectedLocation?.id === loc.id
                              ? "border-seyfarth-blue bg-blue-50/50 ring-1 ring-seyfarth-blue/30"
                              : "hover:border-zinc-400"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 mt-0.5 text-zinc-400" strokeWidth={1.5} />
                            <div>
                              <p className="font-medium text-sm">{loc.name}</p>
                              <p className="text-xs text-zinc-500">
                                {loc.street}, {loc.zip_code} {loc.city}
                              </p>
                            </div>
                            {selectedLocation?.id === loc.id && (
                              <Check className="h-4 w-4 text-seyfarth-blue ml-auto" />
                            )}
                          </div>
                        </div>
                      ))}

                      {!showNewLocation ? (
                        <button
                          onClick={() => setShowNewLocation(true)}
                          className="w-full p-4 border border-dashed rounded-xl text-sm text-zinc-500 hover:text-zinc-700 hover:border-zinc-400 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" /> Neuen Lieferort anlegen
                        </button>
                      ) : (
                        <div className="p-4 border rounded-xl space-y-3 bg-zinc-50">
                          <p className="font-medium text-sm">Neuer Lieferort</p>
                          <Input
                            placeholder="Bezeichnung (z.B. Baustelle Hauptstr.)"
                            value={newLocation.name}
                            onChange={(e) =>
                              setNewLocation((prev) => ({ ...prev, name: e.target.value }))
                            }
                          />
                          <Input
                            placeholder="Straße + Hausnummer"
                            value={newLocation.street}
                            onChange={(e) =>
                              setNewLocation((prev) => ({ ...prev, street: e.target.value }))
                            }
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="PLZ"
                              value={newLocation.zip_code}
                              onChange={(e) =>
                                setNewLocation((prev) => ({ ...prev, zip_code: e.target.value }))
                              }
                            />
                            <Input
                              className="col-span-2"
                              placeholder="Ort"
                              value={newLocation.city}
                              onChange={(e) =>
                                setNewLocation((prev) => ({ ...prev, city: e.target.value }))
                              }
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleCreateLocation}
                              disabled={
                                locationSaving ||
                                !newLocation.name ||
                                !newLocation.street ||
                                !newLocation.zip_code ||
                                !newLocation.city
                              }
                              className="bg-seyfarth-blue hover:bg-seyfarth-navy text-white"
                            >
                              {locationSaving ? "Wird gespeichert..." : "Speichern"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setShowNewLocation(false)}
                            >
                              Abbrechen
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">
                    Geben Sie die Adresse ein, an die der Container geliefert werden soll.
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Bezeichnung</Label>
                    <Input
                      value={guestLocation.name}
                      onChange={(e) =>
                        setGuestLocation((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="z.B. Baustelle Hauptstr. (optional)"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Straße + Hausnummer *</Label>
                    <Input
                      value={guestLocation.street}
                      onChange={(e) =>
                        setGuestLocation((prev) => ({ ...prev, street: e.target.value }))
                      }
                      placeholder="Musterstraße 123"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">PLZ *</Label>
                      <Input
                        value={guestLocation.zip_code}
                        onChange={(e) =>
                          setGuestLocation((prev) => ({ ...prev, zip_code: e.target.value }))
                        }
                        placeholder="12345"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Ort *</Label>
                      <Input
                        value={guestLocation.city}
                        onChange={(e) =>
                          setGuestLocation((prev) => ({ ...prev, city: e.target.value }))
                        }
                        placeholder="Musterstadt"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ───────── Step: Compliance ───────── */}
        {step === "compliance" && (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-zinc-900">Erzeuger-Pflichten</h2>

              {/* Guest needs to login first */}
              {complianceRequiresLogin && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                    <Lock className="h-7 w-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-lg">Anmeldung erforderlich</h3>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto mt-2">
                      Für die Artikel in Ihrem Warenkorb müssen gesetzliche Pflichtdokumente
                      {complianceInfo.requiresGewabfv && " (GewAbfV)"}
                      {complianceInfo.hasHazardous && " (eANV/Erzeugernummer)"} ausgefüllt werden.
                      Bitte melden Sie sich an, damit diese Dokumente Ihrem Konto zugeordnet werden können.
                    </p>
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={() => {
                        setCheckoutMode(null)
                        setStep("account")
                      }}
                      className="bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
                    >
                      <LogIn className="h-4 w-4 mr-2" /> Jetzt anmelden
                    </Button>
                  </div>
                </div>
              )}

              {/* Authenticated: show compliance forms */}
              {!complianceRequiresLogin && (
                <>
                  {complianceInfo.requiresGewabfv && (
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          GewAbfV-Erklärung erforderlich
                        </h3>
                        <p className="text-sm text-zinc-600 mt-1">
                          Bei gemischten Gewerbeabfällen müssen Sie begründen, warum eine getrennte
                          Sammlung nicht möglich ist.
                        </p>
                      </div>
                      <div>
                        <Label>Begründung der Nicht-Trennung *</Label>
                        <div className="space-y-2 mt-2">
                          {[
                            {
                              value: "technical",
                              label: "Technisch nicht möglich (z.B. Platzmangel auf der Baustelle)",
                            },
                            {
                              value: "economic",
                              label: "Wirtschaftlich unzumutbar (z.B. Menge < 1m³ pro Fraktion)",
                            },
                            { value: "other", label: "Andere Begründung" },
                          ].map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                                gewabfvJustificationType === opt.value
                                  ? "border-seyfarth-blue bg-blue-50/50"
                                  : "hover:bg-zinc-50"
                              }`}
                            >
                              <input
                                type="radio"
                                name="justification"
                                value={opt.value}
                                checked={gewabfvJustificationType === opt.value}
                                onChange={() => setGewabfvJustificationType(opt.value)}
                                className="mt-1"
                              />
                              <span className="text-sm">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {gewabfvJustificationType === "other" && (
                        <div>
                          <Label>Begründung (Freitext) *</Label>
                          <Input
                            value={gewabfvJustificationText}
                            onChange={(e) => setGewabfvJustificationText(e.target.value)}
                            placeholder="Bitte beschreiben Sie, warum eine Trennung nicht möglich ist..."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {complianceInfo.hasHazardous && (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h3 className="font-semibold flex items-center gap-2 text-sm">
                          <ShieldAlert className="h-4 w-4 text-red-600" />
                          Gefährlicher Abfall — Zusätzliche Angaben
                        </h3>
                        <p className="text-sm text-zinc-600 mt-1">
                          Als Abfallerzeuger benötigen Sie eine Erzeugernummer und müssen die
                          eANV-Vertretung bevollmächtigen.
                        </p>
                      </div>
                      <div>
                        <Label>Erzeugernummer (Behörde) *</Label>
                        <Input
                          value={erzeugerNummer}
                          onChange={(e) => setErzeugerNummer(e.target.value)}
                          placeholder="z.B. E12345678"
                        />
                      </div>
                      <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={vollmachtAccepted}
                          onChange={(e) => setVollmachtAccepted(e.target.checked)}
                          className="mt-1"
                        />
                        <span className="text-sm">
                          Ich bevollmächtige den Entsorger, mich im elektronischen
                          Abfallnachweisverfahren (eANV) zu vertreten. Ich bestätige, dass ich als
                          Abfallerzeuger die Verantwortung für die korrekte Deklaration der Abfälle
                          trage.
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ───────── Step: Details ───────── */}
        {step === "details" && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <h2 className="text-lg font-semibold text-zinc-900">Auftragsdetails</h2>

              <div>
                <Label className="text-sm font-medium">Auftragsart</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[
                    { key: "stellen", label: "Stellen" },
                    { key: "abholen", label: "Abholen" },
                    { key: "wechseln", label: "Wechseln" },
                    { key: "umladen", label: "Umladen" },
                  ].map((t) => (
                    <Button
                      key={t.key}
                      variant={orderType === t.key ? "default" : "outline"}
                      onClick={() => setOrderType(t.key)}
                      className={`rounded-full ${
                        orderType === t.key
                          ? "bg-seyfarth-blue hover:bg-seyfarth-navy text-white"
                          : ""
                      }`}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="desiredDate" className="text-sm font-medium">
                  Wunschtermin
                </Label>
                <Input
                  id="desiredDate"
                  type="date"
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1.5 max-w-xs"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Optional — wir melden uns zur Terminabstimmung.
                </p>
              </div>

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">
                  Bemerkungen
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zufahrtshinweise, Sonderwünsche..."
                  className="mt-1.5"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ───────── Step: Confirm ───────── */}
        {step === "confirm" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-lg font-semibold text-zinc-900">Zusammenfassung</h2>

                {/* Cart items */}
                <div className="space-y-2">
                  {items.map((item) => {
                    const wasteInfo = getProductWasteInfo(item.productId)
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div>
                          <span className="text-zinc-700">
                            {item.productTitle} — {item.variantTitle}
                          </span>
                          {wasteInfo?.avvNumber && (
                            <span className="text-zinc-400 text-xs ml-2">AVV {wasteInfo.avvNumber}</span>
                          )}
                        </div>
                        <span className="font-medium shrink-0 ml-4">{formatPrice(item.price)}</span>
                      </div>
                    )
                  })}
                  <div className="flex justify-between text-sm font-bold pt-3 border-t">
                    <span>Gesamtsumme</span>
                    <span className="text-seyfarth-navy text-lg">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Order details grid */}
                <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm pt-4 border-t">
                  <p className="text-zinc-500">Kunde:</p>
                  <p className="text-zinc-900">
                    {isAuthenticated && customer
                      ? `${customer.first_name} ${customer.last_name}${customer.company_name ? ` (${customer.company_name})` : ""}`
                      : `${guestFirstName} ${guestLastName}${guestCompany ? ` (${guestCompany})` : ""}`}
                  </p>

                  <p className="text-zinc-500">E-Mail:</p>
                  <p className="text-zinc-900">
                    {isAuthenticated && customer ? customer.email : guestEmail}
                  </p>

                  <p className="text-zinc-500">Lieferort:</p>
                  <p className="text-zinc-900">
                    {isAuthenticated
                      ? `${selectedLocation?.name} — ${selectedLocation?.street}, ${selectedLocation?.zip_code} ${selectedLocation?.city}`
                      : `${guestLocation.street}, ${guestLocation.zip_code} ${guestLocation.city}`}
                  </p>

                  {erzeugerNummer && (
                    <>
                      <p className="text-zinc-500">Erzeugernummer:</p>
                      <p className="text-zinc-900">{erzeugerNummer}</p>
                    </>
                  )}

                  <p className="text-zinc-500">Auftragsart:</p>
                  <p className="text-zinc-900 capitalize">{orderType}</p>

                  <p className="text-zinc-500">Wunschtermin:</p>
                  <p className="text-zinc-900">
                    {desiredDate
                      ? new Date(desiredDate).toLocaleDateString("de-DE", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Kein Wunschtermin"}
                  </p>

                  {notes && (
                    <>
                      <p className="text-zinc-500">Bemerkungen:</p>
                      <p className="text-zinc-900">{notes}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Legal confirmation */}
            <Card>
              <CardContent className="p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={legalConfirmed}
                    onChange={(e) => setLegalConfirmed(e.target.checked)}
                    className="mt-1 accent-seyfarth-blue"
                  />
                  <span className="text-sm text-zinc-700 leading-relaxed">
                    Ich bestätige die Richtigkeit meiner Angaben. Mir ist bewusst, dass ich als
                    Abfallerzeuger für die korrekte Deklaration der Abfälle verantwortlich bin und bei
                    Falschdeklaration hafte.
                  </span>
                </label>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ───────── Error Message ───────── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 mt-4">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ───────── Navigation ───────── */}
        <div className="flex justify-between pt-4">
          {getPrevStep(step) ? (
            <Button
              variant="outline"
              onClick={() => setStep(getPrevStep(step)!)}
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Zurück
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="rounded-full text-zinc-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Zum Shop
            </Button>
          )}

          {getNextStep(step) ? (
            <Button
              onClick={() => setStep(getNextStep(step)!)}
              disabled={!canProceed()}
              className="bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
            >
              Weiter <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : step === "confirm" ? (
            <Button
              onClick={handleConfirm}
              disabled={!canProceed() || submitting}
              className="bg-seyfarth-orange hover:bg-seyfarth-yellow hover:text-seyfarth-navy text-white rounded-full px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Wird bestellt...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" /> Auftrag bestätigen
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </PublicShell>
  )
}
