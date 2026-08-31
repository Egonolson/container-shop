"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ClipboardCheck,
  Info,
  Layers,
  Leaf,
  Loader2,
  Mail,
  MapPin,
  Mountain,
  Newspaper,
  Package,
  Phone,
  Radiation,
  Recycle,
  ShoppingCart,
  Sprout,
  TreePine,
  Truck,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"
import { validateRegistration } from "@/lib/auth/validate-registration"
import { REGISTRATION_ENABLED } from "@/lib/config"

type ConstructionSite = Database["public"]["Tables"]["construction_sites"]["Row"]

// Leaflet touches window/document, so the map only loads in the browser.
const PlacementMap = dynamic(() => import("./placement-map"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-zinc-100" />,
})
import {
  REQUEST_FORM_VERSION,
  ShopMode,
  PlacementType,
  containerSizes,
  earliestDeliveryDate,
  formatEuro,
  getTransportPrice,
  getCityForPostalCode,
  isNonWorkingDay,
  lookupZone,
  materialItems,
  parseLocalDateInputValue,
  toLocalDateInputValue,
  wasteItems,
} from "@/lib/seyfarth-shop-data"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DRAFT_STORAGE_KEY = "seyfarth-draft"

type Step = "mode" | "location" | "selection" | "container" | "placement" | "dates" | "contact" | "summary"
type EmailAccountState = "idle" | "checking" | "exists" | "new"

const steps: { key: Step; label: string }[] = [
  { key: "mode", label: "Bereich" },
  { key: "location", label: "Ort" },
  { key: "selection", label: "Auswahl" },
  { key: "container", label: "Größe" },
  { key: "placement", label: "Stellplatz" },
  { key: "dates", label: "Termin" },
  { key: "contact", label: "Kontakt" },
  { key: "summary", label: "Prüfen" },
]

const WASTE_CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Bauschutt": Building2,
  "Mischabfälle": Layers,
  "Holz": TreePine,
  "Grünabfall": Leaf,
  "Boden / Erde": Mountain,
  "Ausbau": Wrench,
  "Gefährliche Abfälle": Radiation,
  "Papier / Pappe": Newspaper,
}

const MATERIAL_CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Erden": Sprout,
  "Recyclingmaterial": Layers,
  "Kiese": Mountain,
  "Splitt und Steine": Mountain,
  "Sande": Mountain,
}

const CONTAINER_TYPE_GROUPS = [
  {
    key: "absetzer",
    label: "Absetzcontainer",
    description: "Für kurze Standzeiten direkt vor Ort – ideal für kleinere bis mittlere Mengen.",
    photo: "/images/fleet/absetzkipper.webp",
    sizes: ["3 m³", "5 m³", "7 m³"],
  },
  {
    key: "abroller",
    label: "Abrollcontainer",
    description: "Für größere Mengen und Großbaustellen – wird per Abrollkipper geliefert.",
    photo: "/images/fleet/abrollkipper.webp",
    sizes: ["10 m³", "12 m³", "15 m³", "20 m³", "30 m³", "40 m³"],
  },
] as const

const emptyContact = {
  customerType: "private",
  firstName: "",
  lastName: "",
  company: "",
  email: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
  message: "",
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function stepIndex(step: Step) {
  return steps.findIndex((item) => item.key === step)
}

export function SeyfarthConfigurator() {
  const [step, setStep] = useState<Step>("mode")
  const [mode, setMode] = useState<ShopMode | null>(null)
  const [wasteGroupOpen, setWasteGroupOpen] = useState(false)
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
  const [autoFilledCity, setAutoFilledCity] = useState<string | null>(null)
  const [selectedWasteId, setSelectedWasteId] = useState("")
  const [selectedMaterialId, setSelectedMaterialId] = useState("")
  const [transportDescription, setTransportDescription] = useState("")
  const [containerSize, setContainerSize] = useState("5 m³")
  const [quantity, setQuantity] = useState("1")
  const [placement, setPlacement] = useState<PlacementType | null>(null)
  const [permitAccepted, setPermitAccepted] = useState(false)
  const [safetyAccepted, setSafetyAccepted] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [dateFlexibility, setDateFlexibility] = useState("telefonisch abstimmen")
  const [contact, setContact] = useState(emptyContact)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [wantsAccount, setWantsAccount] = useState(false)
  const [emailAccountState, setEmailAccountState] = useState<EmailAccountState>("idle")
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [sites, setSites] = useState<ConstructionSite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null)
  const [placementCoords, setPlacementCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [photoPath, setPhotoPath] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const successRef = useRef<HTMLElement | null>(null)
  const reorderAppliedRef = useRef(false)
  const draftAppliedRef = useRef(false)

  // "Nochmal anfragen": restore a past request handed over from /konto via
  // localStorage. Runs before the profile prefill (see below) and wins on
  // the contact block, since these are the values the customer chose to
  // repeat. Dates are intentionally NOT restored — a repeat needs fresh ones.
  useEffect(() => {
    let raw: string | null = null
    try {
      raw = localStorage.getItem("seyfarth-reorder")
      if (raw) localStorage.removeItem("seyfarth-reorder")
    } catch {
      return
    }
    if (!raw) return
    let p: Record<string, unknown>
    try {
      p = JSON.parse(raw)
    } catch {
      return
    }
    const restoredMode = typeof p.mode === "string" ? p.mode : ""
    if (!["entsorgung", "baustoffe", "transport"].includes(restoredMode)) return
    reorderAppliedRef.current = true
    const loc = (p.location ?? {}) as Record<string, unknown>
    const sel = (p.selection ?? {}) as Record<string, unknown>
    const plc = (p.placement ?? {}) as Record<string, unknown>
    const con = (p.contact ?? {}) as Record<string, unknown>
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback)

    setMode(restoredMode as ShopMode)
    setPostalCode(str(loc.postalCode))
    setCity(str(loc.city))
    if (restoredMode === "entsorgung") {
      setSelectedWasteId(str(sel.id))
      if (str(sel.containerSize)) setContainerSize(str(sel.containerSize))
    } else if (restoredMode === "baustoffe") {
      setSelectedMaterialId(str(sel.id))
      const q = (sel.quantity ?? {}) as Record<string, unknown>
      if (typeof q.value === "number") setQuantity(String(q.value))
    } else {
      setTransportDescription(str(sel.description))
    }
    if (["private", "public"].includes(str(plc.type))) setPlacement(str(plc.type) as PlacementType)
    setContact((current) => ({
      ...current,
      customerType: str(con.customerType, current.customerType) === "business" ? "business" : "private",
      firstName: str(con.firstName, current.firstName),
      lastName: str(con.lastName, current.lastName),
      company: str(con.company, current.company),
      email: str(con.email, current.email),
      phone: str(con.phone, current.phone),
      street: str(con.street, current.street),
      postalCode: str(con.postalCode, current.postalCode),
      city: str(con.city, current.city),
      message: str(con.message, current.message),
    }))
  }, [])

  // Resume-after-reload: mirrors the in-progress wizard to localStorage (see
  // the persist effect below) and restores it here so an accidental reload
  // doesn't wipe out everything the customer already entered. A "Nochmal
  // anfragen" reorder is a deliberate, more recent action and wins over a
  // possibly-stale leftover draft, so this is skipped when one applied.
  useEffect(() => {
    if (reorderAppliedRef.current) return
    let raw: string | null = null
    try {
      raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    } catch {
      return
    }
    if (!raw) return
    let p: Record<string, unknown>
    try {
      p = JSON.parse(raw)
    } catch {
      return
    }
    const restoredMode = typeof p.mode === "string" ? p.mode : ""
    if (!["entsorgung", "baustoffe", "transport"].includes(restoredMode)) return
    draftAppliedRef.current = true
    const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback)
    const bool = (v: unknown) => v === true
    const con = (p.contact ?? {}) as Record<string, unknown>

    setMode(restoredMode as ShopMode)
    if (typeof p.step === "string" && steps.some((item) => item.key === p.step)) setStep(p.step as Step)
    setWasteGroupOpen(bool(p.wasteGroupOpen))
    setPostalCode(str(p.postalCode))
    setCity(str(p.city))
    setSelectedWasteId(str(p.selectedWasteId))
    setSelectedMaterialId(str(p.selectedMaterialId))
    setTransportDescription(str(p.transportDescription))
    if (str(p.containerSize)) setContainerSize(str(p.containerSize))
    if (str(p.quantity)) setQuantity(str(p.quantity))
    if (["private", "public", "unknown"].includes(str(p.placement))) setPlacement(str(p.placement) as PlacementType)
    setPermitAccepted(bool(p.permitAccepted))
    setSafetyAccepted(bool(p.safetyAccepted))
    setDeliveryDate(str(p.deliveryDate))
    setPickupDate(str(p.pickupDate))
    if (str(p.dateFlexibility)) setDateFlexibility(str(p.dateFlexibility))
    if (typeof p.photoPath === "string") setPhotoPath(p.photoPath)
    const coords = (p.placementCoords ?? null) as { lat?: unknown; lng?: unknown } | null
    if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
      setPlacementCoords({ lat: coords.lat, lng: coords.lng })
    }
    if (typeof p.constructionSiteId === "string") setSelectedSiteId(p.constructionSiteId)
    setContact((current) => ({
      ...current,
      customerType: str(con.customerType, current.customerType) === "business" ? "business" : "private",
      firstName: str(con.firstName, current.firstName),
      lastName: str(con.lastName, current.lastName),
      company: str(con.company, current.company),
      email: str(con.email, current.email),
      phone: str(con.phone, current.phone),
      street: str(con.street, current.street),
      postalCode: str(con.postalCode, current.postalCode),
      city: str(con.city, current.city),
      message: str(con.message, current.message),
    }))
  }, [])

  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active || !data.user?.email) return
      setLoggedInEmail(data.user.email)
      setLoggedInUserId(data.user.id)
      // Load the customer's saved construction sites so they can pick one in
      // the location step instead of typing an address.
      supabase
        .from("construction_sites")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .then(({ data: siteRows }) => {
          if (active && siteRows) setSites(siteRows)
        })
      // Prefill the contact step from the saved profile so returning
      // customers don't retype their details ("schnell bestellen"). Skipped
      // when a reorder or a resumed draft already restored the contact block
      // (those win).
      if (reorderAppliedRef.current || draftAppliedRef.current) return
      const { data: profile } = await supabase
        .from("customer_profiles")
        .select("customer_kind, first_name, last_name, company_name, phone, street, house_number, postal_code, city")
        .eq("id", data.user.id)
        .single()
      if (!active || !profile || reorderAppliedRef.current || draftAppliedRef.current) return
      setContact((current) => ({
        ...current,
        customerType: profile.customer_kind === "business" ? "business" : "private",
        firstName: profile.first_name ?? current.firstName,
        lastName: profile.last_name ?? current.lastName,
        company: profile.company_name ?? current.company,
        email: data.user.email ?? current.email,
        phone: profile.phone ?? current.phone,
        street: [profile.street, profile.house_number].filter(Boolean).join(" ") || current.street,
        postalCode: profile.postal_code ?? current.postalCode,
        city: profile.city ?? current.city,
      }))
    })
    return () => {
      active = false
    }
  }, [])

  // Mirrors the in-progress wizard to localStorage so the restore effect
  // above can resume it after an accidental reload. Only meaningful once a
  // Bereich was actually chosen — otherwise every visit would write a
  // trivial "nothing selected" draft. `privacyAccepted` is deliberately NOT
  // persisted: consent should be re-confirmed fresh, not silently restored.
  useEffect(() => {
    if (!mode) return
    const snapshot = {
      step,
      mode,
      wasteGroupOpen,
      postalCode,
      city,
      selectedWasteId,
      selectedMaterialId,
      transportDescription,
      containerSize,
      quantity,
      placement,
      permitAccepted,
      safetyAccepted,
      deliveryDate,
      pickupDate,
      dateFlexibility,
      contact,
      photoPath,
      placementCoords,
      constructionSiteId: selectedSiteId,
    }
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      // storage unavailable (private mode / quota) — resume is best-effort
    }
  }, [step, mode, wasteGroupOpen, postalCode, city, selectedWasteId, selectedMaterialId, transportDescription, containerSize, quantity, placement, permitAccepted, safetyAccepted, deliveryDate, pickupDate, dateFlexibility, contact, photoPath, placementCoords, selectedSiteId])

  const selectSite = (site: ConstructionSite) => {
    setSelectedSiteId(site.id)
    setPostalCode(site.postal_code ?? "")
    setCity(site.city ?? "")
    setAutoFilledCity(null)
    setContact((current) => ({
      ...current,
      street: [site.street, site.house_number].filter(Boolean).join(" ") || current.street,
      postalCode: site.postal_code ?? current.postalCode,
      city: site.city ?? current.city,
    }))
  }

  const useNewAddress = () => {
    setSelectedSiteId(null)
    setPostalCode("")
    setCity("")
    setAutoFilledCity(null)
  }

  const handlePhotoUpload = async (file: File) => {
    setPhotoError(null)
    if (!file.type.startsWith("image/")) {
      setPhotoError("Bitte laden Sie eine Bilddatei hoch.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Das Bild darf höchstens 10 MB groß sein.")
      return
    }
    setPhotoUploading(true)
    try {
      if (loggedInUserId) {
        const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
        // Path must start with the user id — the storage RLS keys on that folder.
        const path = `${loggedInUserId}/${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await createClient().storage.from("placement-photos").upload(path, file, { upsert: false })
        if (uploadError) throw uploadError
        setPhotoPath(path)
      } else {
        // Guests have no session to key Storage RLS on — the upload goes
        // through a server route that writes via the service role instead.
        const formData = new FormData()
        formData.append("file", file)
        const response = await fetch("/api/shop-requests/photo", { method: "POST", body: formData })
        const data = await response.json().catch(() => ({}))
        if (!response.ok || !data?.path) throw new Error(data?.message || "upload failed")
        setPhotoPath(data.path)
      }
    } catch {
      setPhotoError("Das Bild konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut.")
    } finally {
      setPhotoUploading(false)
    }
  }

  const checkEmailAccount = async () => {
    if (loggedInEmail || !REGISTRATION_ENABLED) return
    if (!EMAIL_RE.test(contact.email)) {
      setEmailAccountState("idle")
      return
    }
    setEmailAccountState("checking")
    try {
      const { data, error: rpcError } = await createClient().rpc("email_has_account", { check_email: contact.email })
      if (rpcError) throw rpcError
      setEmailAccountState(data ? "exists" : "new")
    } catch {
      // Conservative fallback: treat as a new account. A genuine duplicate
      // still gets caught by signUp() itself at submit time.
      setEmailAccountState("new")
    }
  }

  const minDeliveryDate = useMemo(() => earliestDeliveryDate(), [])
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(minDeliveryDate.getFullYear(), minDeliveryDate.getMonth(), 1))

  // Single calendar drives both dates: first click sets Lieferdatum, a later
  // click sets Abholdatum (range highlighted in between). Clicking the
  // Lieferdatum again clears it; clicking an earlier day restarts the range.
  // Modes without a pickup (transport/baustoffe) just overwrite Lieferdatum.
  const handleDateSelect = (iso: string) => {
    if (mode !== "entsorgung") {
      setDeliveryDate(iso)
      return
    }
    if (!deliveryDate || (deliveryDate && pickupDate)) {
      setDeliveryDate(iso)
      setPickupDate("")
    } else if (iso > deliveryDate) {
      setPickupDate(iso)
    } else if (iso === deliveryDate) {
      setDeliveryDate("")
    } else {
      setDeliveryDate(iso)
    }
  }
  const zoneMatch = useMemo(() => lookupZone(postalCode, city), [postalCode, city])
  const selectedWaste = wasteItems.find((item) => item.id === selectedWasteId)
  const selectedMaterial = materialItems.find((item) => item.id === selectedMaterialId)
  const zone = zoneMatch?.zone
  const transportPrice = mode ? getTransportPrice(zone, mode, containerSize) : null
  const materialQuantity = Number.parseFloat(quantity.replace(",", ".")) || 0
  const materialNet = selectedMaterial && materialQuantity > 0 ? selectedMaterial.netPrice * materialQuantity : 0
  const materialTotalNet = mode === "baustoffe" && transportPrice !== null ? materialNet + transportPrice : null
  const wasteTransportNet = mode === "entsorgung" ? transportPrice : null
  const requiresManualReview = mode === "transport" || selectedWaste?.isHazardous || selectedWaste?.paymentMode === "inquiry_only" || placement === "public"

  useEffect(() => {
    if (!submittedId) return
    const top = (successRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 120
    window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" })
  }, [submittedId])

  const updateContact = (field: keyof typeof contact, value: string) => {
    setContact((current) => ({ ...current, [field]: value }))
  }

  useEffect(() => {
    const suggestedCity = getCityForPostalCode(postalCode)

    if (suggestedCity && (!city.trim() || city === autoFilledCity)) {
      setCity(suggestedCity)
      setAutoFilledCity(suggestedCity)
      setContact((current) => ({ ...current, city: suggestedCity }))
      return
    }

    if (!suggestedCity && autoFilledCity && city === autoFilledCity) {
      setCity("")
      setAutoFilledCity(null)
      setContact((current) => ({ ...current, city: "" }))
    }
  }, [autoFilledCity, city, postalCode])

  const goNext = () => {
    const next = steps[stepIndex(step) + 1]?.key
    if (next) setStep(next)
  }

  const goBack = () => {
    const previous = steps[stepIndex(step) - 1]?.key
    if (previous) setStep(previous)
  }

  const canContinue = () => {
    switch (step) {
      case "mode": return !!mode
      case "location": return postalCode.trim().length >= 4 && city.trim().length >= 2
      case "selection": return mode === "transport" ? transportDescription.trim().length >= 8 : mode === "entsorgung" ? !!selectedWaste : mode === "baustoffe" ? !!selectedMaterial : false
      case "container": return mode === "baustoffe" ? materialQuantity > 0 : !!containerSize
      case "placement": return !!placement && (placement !== "public" || permitAccepted) && (!selectedWaste?.isHazardous || safetyAccepted)
      case "dates": return !!deliveryDate || dateFlexibility === "telefonisch abstimmen"
      case "contact": {
        const baseOk = !!(contact.firstName && contact.lastName && contact.email && contact.phone && contact.street && contact.postalCode && contact.city)
        if (!baseOk) return false
        if (loggedInEmail) return true
        // Registration off (e.g. PROD until SMTP): everyone submits as guest;
        // business only still needs a company name, never a password.
        if (!REGISTRATION_ENABLED) return contact.customerType !== "business" || !!contact.company
        if (emailAccountState === "checking") return false
        if (emailAccountState === "exists") return password.length > 0
        if (contact.customerType === "business") return !!contact.company && password.length >= 8
        if (wantsAccount) return password.length >= 8
        return true
      }
      case "summary": return privacyAccepted
      default: return false
    }
  }

  const continueHint = () => {
    switch (step) {
      case "mode": return "Bitte wählen Sie zuerst einen Bereich aus."
      case "location": return "Bitte geben Sie PLZ und Ort ein."
      case "selection": return mode === "transport" ? "Bitte beschreiben Sie die Transportaufgabe kurz." : "Bitte wählen Sie eine passende Auswahl aus."
      case "container": return mode === "baustoffe" ? "Bitte geben Sie die gewünschte Menge ein." : "Bitte wählen Sie eine Containergröße aus – auch „Ich bin unsicher“ ist möglich."
      case "placement": return "Bitte wählen Sie den Stellplatz und bestätigen Sie erforderliche Hinweise."
      case "dates": return "Bitte nennen Sie ein Wunschdatum oder wählen Sie telefonische Abstimmung."
      case "contact": {
        if (!REGISTRATION_ENABLED) {
          if (contact.customerType === "business" && !contact.company) return "Bitte geben Sie den Firmennamen an."
          return "Bitte füllen Sie die Pflichtfelder für die Kontaktaufnahme aus."
        }
        if (emailAccountState === "checking") return "Wir prüfen kurz Ihre E-Mail-Adresse …"
        if (emailAccountState === "exists" && !loggedInEmail) return "Diese E-Mail ist bereits registriert – bitte Passwort eingeben, um sich anzumelden."
        if (!loggedInEmail && contact.customerType === "business") return "Für Gewerbekunden sind Firma und ein Kundenkonto (Passwort) erforderlich."
        return "Bitte füllen Sie die Pflichtfelder für die Kontaktaufnahme aus."
      }
      case "summary": return "Bitte bestätigen Sie die Datenschutzhinweise."
      default: return "Bitte vervollständigen Sie die Angaben."
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!privacyAccepted) return
    setSubmitting(true)
    setError(null)

    if (!loggedInEmail && REGISTRATION_ENABLED) {
      const supabase = createClient()
      try {
        if (emailAccountState === "exists") {
          const { error: authError } = await supabase.auth.signInWithPassword({ email: contact.email, password })
          if (authError) throw new Error("Anmeldung fehlgeschlagen: falsches Passwort oder unbekannte E-Mail-Adresse.")
        } else if (contact.customerType === "business" || wantsAccount) {
          const registrationErrors = validateRegistration({
            customerKind: contact.customerType === "business" ? "business" : "private",
            email: contact.email,
            password,
            firstName: contact.firstName,
            lastName: contact.lastName,
            companyName: contact.company,
          })
          if (registrationErrors.length > 0) throw new Error(registrationErrors[0].message)
          const { error: authError } = await supabase.auth.signUp({
            email: contact.email,
            password,
            options: {
              data: {
                customer_kind: contact.customerType,
                first_name: contact.firstName || null,
                last_name: contact.lastName || null,
                company_name: contact.company || null,
              },
            },
          })
          if (authError) throw new Error(authError.message)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Konto konnte nicht angelegt bzw. Anmeldung nicht durchgeführt werden.")
        setSubmitting(false)
        return
      }
    }

    const payload = {
      requestFormVersion: REQUEST_FORM_VERSION,
      mode,
      intent: "inquiry",
      location: { postalCode, city, zone: zone ?? null, zoneKnown: !!zoneMatch },
      selection: mode === "entsorgung" ? selectedWaste : mode === "baustoffe" ? selectedMaterial : { description: transportDescription },
      containerSize: mode === "entsorgung" ? containerSize : undefined,
      quantity: mode === "baustoffe" ? { value: materialQuantity, unit: selectedMaterial?.unit } : undefined,
      placement: { type: placement, permitAccepted, safetyAccepted, coordinates: placementCoords, photoPath },
      dates: { deliveryDate, pickupDate, flexibility: dateFlexibility },
      pricing: { transportNet: transportPrice, materialNet, materialTotalNet, wasteDisposalNetPerUnit: selectedWaste?.netPrice, finalByWeighing: selectedWaste?.requiresWeighing },
      contact,
      constructionSiteId: selectedSiteId,
      confirmations: { privacyAccepted, submittedNoticeVersion: REQUEST_FORM_VERSION },
    }

    try {
      const response = await fetch("/api/shop-requests", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.message || "Anfrage konnte nicht gesendet werden.")
      const id = data.requestId || `SEY-${Date.now()}`
      localStorage.setItem(
        "seyfarth-last-request",
        JSON.stringify({
          id,
          submittedAt: new Date().toISOString(),
          mode,
          intent: "inquiry",
        }),
      )
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      setSubmittedId(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Anfrage konnte nicht gesendet werden.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return (
      <section ref={successRef} id="katalog" className="scroll-mt-32 bg-white py-32 md:py-36">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-[32px] border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-white">
              <Check className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">Anfrage eingegangen</p>
            <h2 className="mt-3 font-headline text-3xl font-extrabold text-seyfarth-navy">Vielen Dank. Wir prüfen Ihre Angaben persönlich.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-600">
              Ihre Referenz lautet <strong>{submittedId}</strong>. Seyfarth meldet sich zur Bestätigung von Preis, Termin und Verfügbarkeit. Bei Entsorgungen wird der endgültige Preis nach dem tatsächlichen Gewicht berechnet.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy">Neue Anfrage starten</Button>
              <Button asChild variant="outline" className="rounded-xl"><a href="tel:03449155200"><Phone className="mr-2 h-4 w-4" />034491 5520-0</a></Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="katalog" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-seyfarth-blue">Online-Konfigurator</p>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-seyfarth-navy md:text-5xl">
            Container, Baustoffe oder Transport <span className="text-seyfarth-yellow italic">anfragen</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-zinc-600">
            Wählen Sie Leistung, Lieferort, Details und Terminwunsch. Seyfarth prüft Preis, Verfügbarkeit und wichtige Hinweise persönlich, bevor Kosten entstehen.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="rounded-[32px] border border-zinc-100 bg-zinc-50/60 p-4 shadow-sm md:p-6">
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {steps.map((item, index) => {
                const active = item.key === step
                const completed = index < stepIndex(step)
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => completed && setStep(item.key)}
                    disabled={!active && !completed}
                    aria-current={active ? "step" : undefined}
                    className={cx(
                      "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue disabled:cursor-not-allowed",
                      active && "border-seyfarth-blue bg-seyfarth-blue text-white",
                      completed && !active && "border-seyfarth-blue/30 bg-white text-seyfarth-blue",
                      !active && !completed && "border-zinc-200 bg-white text-zinc-400",
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10">{completed ? <Check className="h-3 w-3" /> : index + 1}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm md:p-8">
              {step === "mode" && (
                <StepBlock title="Was möchten Sie anfragen?" intro="Wählen Sie zuerst aus, worum es geht. Danach erfassen wir Ort, Auswahl, Größe, Stellplatz und Terminwunsch.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ChoiceCard
                      active={wasteGroupOpen || mode === "entsorgung" || mode === "baustoffe"}
                      icon={Recycle}
                      title="Abfall / Schüttgut"
                      text="Container für die Entsorgung von Abfällen oder Lieferung von Baustoffen und Schüttgut anfragen."
                      onClick={() => { setWasteGroupOpen(true); setMode(null) }}
                    />
                    <ChoiceCard
                      active={mode === "transport"}
                      icon={Truck}
                      title="Transport"
                      text="Transportleistung mit Abholort, Zielort und gewünschtem Zeitraum anfragen."
                      onClick={() => { setWasteGroupOpen(false); setMode("transport") }}
                    />
                  </div>
                  {(wasteGroupOpen || mode === "entsorgung" || mode === "baustoffe") && (
                    <div className="space-y-3 rounded-2xl border border-dashed border-seyfarth-blue/30 bg-seyfarth-blue/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-seyfarth-blue">Bitte genauer auswählen</p>
                      <div className="grid gap-4 md:grid-cols-2">
                        <ChoiceCard active={mode === "entsorgung"} icon={Recycle} title="Abfallarten" text="Container für Bauschutt, Sperrmüll, Holz, Grünschnitt und weitere Abfälle anfragen." onClick={() => setMode("entsorgung")} />
                        <ChoiceCard active={mode === "baustoffe"} icon={Package} title="Schüttgut / Baustoffe" text="Schüttgut oder Recyclingmaterial liefern lassen – Preis abhängig von Menge und Lieferort." onClick={() => setMode("baustoffe")} />
                      </div>
                    </div>
                  )}
                </StepBlock>
              )}

              {step === "location" && (
                <StepBlock title="Wo soll der Container stehen oder Material geliefert werden?" intro="Mit PLZ und Ort prüfen wir, ob Ihr Standort im Liefergebiet liegt und welche Transportzone gilt.">
                  {sites.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Ihre Baustellen &amp; Standorte</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {sites.map((site) => (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() => selectSite(site)}
                            aria-pressed={selectedSiteId === site.id}
                            className={cx(
                              "flex items-start gap-3 rounded-2xl border p-3 text-left transition hover:border-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                              selectedSiteId === site.id ? "border-seyfarth-blue bg-seyfarth-blue/5 shadow-sm" : "border-zinc-200 bg-white",
                            )}
                          >
                            <MapPin className={cx("mt-0.5 h-5 w-5 shrink-0", selectedSiteId === site.id ? "text-seyfarth-blue" : "text-zinc-400")} />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-seyfarth-navy">{site.name}</span>
                              <span className="block truncate text-xs text-zinc-500">{[[site.street, site.house_number].filter(Boolean).join(" "), [site.postal_code, site.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</span>
                            </span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={useNewAddress}
                          aria-pressed={selectedSiteId === null}
                          className={cx(
                            "flex items-center gap-3 rounded-2xl border border-dashed p-3 text-left text-sm font-medium transition hover:border-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                            selectedSiteId === null ? "border-seyfarth-blue bg-seyfarth-blue/5 text-seyfarth-navy" : "border-zinc-300 bg-white text-zinc-500",
                          )}
                        >
                          <MapPin className="h-5 w-5 shrink-0 text-zinc-400" />
                          Andere / neue Adresse eingeben
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Postleitzahl"><input value={postalCode} onChange={(e) => { setPostalCode(e.target.value); setSelectedSiteId(null); updateContact("postalCode", e.target.value) }} className="sey-input" inputMode="numeric" autoComplete="postal-code" placeholder="z. B. 04639" /></Field>
                    <Field label="Ort"><input value={city} onChange={(e) => { setCity(e.target.value); setAutoFilledCity(null); setSelectedSiteId(null); updateContact("city", e.target.value) }} className="sey-input" autoComplete="address-level2" placeholder="wird nach PLZ automatisch ergänzt" /></Field>
                  </div>
                  {zoneMatch && (
                    <Notice tone="success">
                      Gute Nachricht: {zoneMatch.city} liegt in unserem Liefergebiet, Zone {zoneMatch.zone}. Den genauen Transportanteil berücksichtigen wir in Ihrer Anfrage.
                    </Notice>
                  )}
                  {!zoneMatch && postalCode.trim().length === 5 && (
                    <Notice tone="warning">
                      Die angegebene Postleitzahl {postalCode.trim()} liegt außerhalb unserer Lieferzonen. Bitte nehmen Sie Kontakt mit uns auf und wir erstellen Ihnen ein individuelles Angebot.
                    </Notice>
                  )}
                </StepBlock>
              )}

              {step === "selection" && mode === "entsorgung" && (
                <StepBlock title="Welche Abfallart möchten Sie entsorgen?" intro="Bitte wählen Sie möglichst genau aus. Bei Asbest, Mineralwolle, teerhaltiger Dachpappe oder anderen Sonderfällen prüfen wir Ihre Anfrage vorab persönlich.">
                  <div className="grid gap-3 md:grid-cols-2">
                    {wasteItems.map((item) => {
                      const CategoryIcon = WASTE_CATEGORY_ICONS[item.category] ?? Package
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedWasteId(item.id)}
                          aria-pressed={selectedWasteId === item.id}
                          className={cx(
                            "min-h-24 rounded-2xl border p-4 text-left transition hover:border-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                            selectedWasteId === item.id ? "border-seyfarth-blue bg-seyfarth-blue/5 shadow-sm" : "border-zinc-200 bg-white",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seyfarth-blue/10"><CategoryIcon className="h-5 w-5 text-seyfarth-blue" /></span>
                              <div><p className="font-bold text-seyfarth-navy">{item.name}</p><p className="text-xs text-zinc-500">Abfallschlüssel: ASN {item.avv} · Entsorgung nach Gewicht: {formatEuro(item.netPrice)} netto/{item.unit}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedWasteId === item.id && <span className="inline-flex items-center gap-1 rounded-full bg-seyfarth-blue px-2 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" />Ausgewählt</span>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedWaste?.notice && (
                    <Notice tone="warning">
                      {selectedWaste.notice}
                      {selectedWaste.packaging ? ` Verpackung/Hinweis: ${selectedWaste.packaging}.` : ""}
                    </Notice>
                  )}
                </StepBlock>
              )}

              {step === "selection" && mode === "baustoffe" && (
                <StepBlock title="Welches Material benötigen Sie?" intro="Wählen Sie das Material aus. Menge und Lieferort werden als Grundlage für Ihre Anfrage berücksichtigt.">
                  <div className="grid gap-3 md:grid-cols-2">
                    {materialItems.map((item) => {
                      const CategoryIcon = MATERIAL_CATEGORY_ICONS[item.category] ?? Package
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedMaterialId(item.id)}
                          aria-pressed={selectedMaterialId === item.id}
                          className={cx(
                            "min-h-24 rounded-2xl border p-4 text-left transition hover:border-seyfarth-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                            selectedMaterialId === item.id ? "border-seyfarth-blue bg-seyfarth-blue/5 shadow-sm" : "border-zinc-200 bg-white",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-seyfarth-blue/10"><CategoryIcon className="h-5 w-5 text-seyfarth-blue" /></span>
                              <div><p className="font-bold text-seyfarth-navy">{item.name}</p><p className="text-xs text-zinc-500">{item.specification} · {formatEuro(item.netPrice)} netto/{item.unit}</p></div>
                            </div>
                            {selectedMaterialId === item.id && <span className="inline-flex items-center gap-1 rounded-full bg-seyfarth-blue px-2 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" />Ausgewählt</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </StepBlock>
              )}

              {step === "selection" && mode === "transport" && (
                <StepBlock title="Was soll transportiert werden?" intro="Beschreiben Sie die Transportaufgabe. Seyfarth prüft Aufwand und Verfügbarkeit persönlich.">
                  <textarea value={transportDescription} onChange={(e) => setTransportDescription(e.target.value)} className="sey-input min-h-36" placeholder="z. B. Abholung von Baumaterial, Zielort, Umfang, gewünschter Zeitraum" />
                </StepBlock>
              )}

              {step === "container" && mode === "baustoffe" && (
                <StepBlock title="Welche Menge benötigen Sie?" intro="Die Menge und der Lieferort helfen uns, Ihre Anfrage realistisch zu prüfen.">
                  <Field label={`Menge in ${selectedMaterial?.unit ?? "Einheit"}`}><input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="sey-input" inputMode="decimal" /></Field>
                </StepBlock>
              )}

              {step === "container" && mode !== "baustoffe" && (
                <StepBlock title="Welche Containergröße benötigen Sie?" intro="Falls Sie unsicher sind, wählen Sie „Ich bin unsicher“. Seyfarth empfiehlt dann die passende Größe.">
                  <div className="grid gap-4 md:grid-cols-2">
                    {CONTAINER_TYPE_GROUPS.map((group) => {
                      const groupActive = (group.sizes as readonly string[]).includes(containerSize)
                      return (
                        <div
                          key={group.key}
                          className={cx(
                            "overflow-hidden rounded-3xl border transition",
                            groupActive ? "border-seyfarth-blue shadow-lg" : "border-zinc-200",
                          )}
                        >
                          <div className="relative h-40 w-full bg-gradient-to-b from-seyfarth-blue/10 to-white">
                            <Image src={group.photo} alt={group.label} fill sizes="(min-width: 768px) 400px, 100vw" className="object-contain p-6" />
                          </div>
                          <div className="space-y-3 p-4">
                            <div>
                              <p className="font-bold text-seyfarth-navy">{group.label}</p>
                              <p className="text-xs text-zinc-500">{group.description}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {group.sizes.map((size) => {
                                const active = containerSize === size
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => setContainerSize(size)}
                                    aria-pressed={active}
                                    className={cx(
                                      "rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                                      active ? "border-seyfarth-blue bg-seyfarth-blue text-white" : "border-zinc-200 bg-white text-seyfarth-navy hover:border-seyfarth-blue",
                                    )}
                                  >
                                    {size}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setContainerSize("Ich bin unsicher")}
                    aria-pressed={containerSize === "Ich bin unsicher"}
                    className={cx(
                      "w-full rounded-2xl border px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
                      containerSize === "Ich bin unsicher" ? "border-seyfarth-blue bg-seyfarth-blue text-white" : "border-zinc-200 bg-white text-seyfarth-navy hover:border-seyfarth-blue",
                    )}
                  >
                    Ich bin unsicher – Seyfarth berät mich
                  </button>
                </StepBlock>
              )}

              {step === "placement" && (
                <StepBlock title="Wo soll der Container abgestellt werden?" intro="Wenn der Container auf Straße, Gehweg oder öffentlicher Fläche steht, kann eine Genehmigung nötig sein. Wir klären das mit Ihnen.">
                  <div className="grid gap-3 md:grid-cols-3">
                    <ChoiceCard active={placement === "private"} icon={MapPin} title="Privatgrundstück" text="Hof, Einfahrt oder eigene Fläche." onClick={() => setPlacement("private")} />
                    <ChoiceCard active={placement === "public"} icon={AlertTriangle} title="Öffentliche Fläche" text="Straße, Gehweg, Parkfläche oder anderer öffentlicher Bereich." onClick={() => setPlacement("public")} />
                    <ChoiceCard active={placement === "unknown"} icon={ClipboardCheck} title="Noch unklar" text="Wir klären den Stellplatz telefonisch mit Ihnen." onClick={() => setPlacement("unknown")} />
                  </div>
                  {placement === "public" && <Checkbox checked={permitAccepted} onChange={setPermitAccepted}>Mir ist bewusst, dass für öffentliche Flächen eine Genehmigung erforderlich sein kann. Seyfarth prüft die nächsten Schritte mit mir.</Checkbox>}
                  {selectedWaste?.isHazardous && <Checkbox checked={safetyAccepted} onChange={setSafetyAccepted}>Ich habe die Hinweise zu gefährlichen Stoffen, Verpackung und Annahmebedingungen gelesen.</Checkbox>}

                  {placement && placement !== "unknown" && (
                    <div className="space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
                      <p className="text-sm font-semibold text-seyfarth-navy">Genauer Abstellort (optional)</p>
                      <p className="text-sm text-zinc-500">
                        Setzen Sie den Punkt exakt dorthin, wo der Container stehen soll. Das hilft unserer Disposition bei der Anfahrt.
                      </p>
                      <PlacementMap value={placementCoords} onChange={setPlacementCoords} />
                      {placementCoords && (
                        <p className="text-xs text-zinc-500">
                          Position gesetzt: {placementCoords.lat.toFixed(5)}, {placementCoords.lng.toFixed(5)}
                        </p>
                      )}

                      <div className="space-y-2">
                        <p className="text-sm font-medium text-seyfarth-navy">Foto vom Stellplatz (optional)</p>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={photoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(file)
                          }}
                          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-seyfarth-blue/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-seyfarth-blue"
                        />
                        {photoUploading && <p className="text-xs text-zinc-500">Bild wird hochgeladen …</p>}
                        {photoPath && !photoUploading && <p className="text-xs text-emerald-600">Foto hochgeladen.</p>}
                        {photoError && <p className="text-xs text-destructive">{photoError}</p>}
                      </div>
                    </div>
                  )}
                </StepBlock>
              )}

              {step === "dates" && (
                <StepBlock title="Wann wünschen Sie Lieferung und Abholung?" intro="Bitte nennen Sie Ihre Wunschtermine. Wir bestätigen per E-Mail, ob diese möglich sind.">
                  <Notice tone="warning">
                    <span className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0" />Zwischen dem Tag der Bestellung und dem Liefertermin muss ein Werktag liegen. Rot markierte Tage sind nicht wählbar.</span>
                  </Notice>
                  <p className="text-sm text-zinc-600">
                    {mode === "entsorgung"
                      ? !deliveryDate
                        ? "Bitte wählen Sie zuerst das Lieferdatum."
                        : !pickupDate
                          ? "Jetzt das Abholdatum wählen (optional bei kurzfristiger Abholung)."
                          : "Termine ausgewählt. Sie können jederzeit neu wählen."
                      : "Bitte wählen Sie das gewünschte Lieferdatum."}
                  </p>
                  <MonthCalendar
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    minDate={minDeliveryDate}
                    startValue={deliveryDate}
                    endValue={mode === "entsorgung" ? pickupDate : undefined}
                    onSelect={handleDateSelect}
                  />
                  <div className={cx("grid gap-3", mode === "entsorgung" ? "grid-cols-2" : "grid-cols-1")}>
                    <div className="rounded-2xl bg-zinc-50 p-3">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Lieferung</p>
                      <p className="mt-1 font-semibold text-seyfarth-navy">{deliveryDate ? parseLocalDateInputValue(deliveryDate)?.toLocaleDateString("de-DE") : "noch offen"}</p>
                    </div>
                    {mode === "entsorgung" && (
                      <div className="rounded-2xl bg-zinc-50 p-3">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">Abholung</p>
                        <p className="mt-1 font-semibold text-seyfarth-navy">{pickupDate ? parseLocalDateInputValue(pickupDate)?.toLocaleDateString("de-DE") : "noch offen"}</p>
                      </div>
                    )}
                  </div>
                  {(deliveryDate || pickupDate) && (
                    <button
                      type="button"
                      onClick={() => { setDeliveryDate(""); setPickupDate("") }}
                      className="text-sm font-semibold text-seyfarth-blue underline underline-offset-4"
                    >
                      Termine zurücksetzen
                    </button>
                  )}
                  <Field label="Terminflexibilität"><select value={dateFlexibility} onChange={(e) => setDateFlexibility(e.target.value)} className="sey-input"><option>telefonisch abstimmen</option><option>Datum ist fest</option><option>Ich bin flexibel</option></select></Field>
                  <Notice tone="success">Wir bestätigen Ihren Wunschtermin in jedem Fall persönlich – per E-Mail.</Notice>
                </StepBlock>
              )}

              {step === "contact" && (
                <StepBlock title="Wohin dürfen wir das Angebot senden?" intro="Wir nutzen Ihre Angaben nur zur Bearbeitung dieser Anfrage.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Kundentyp"><select value={contact.customerType} onChange={(e) => updateContact("customerType", e.target.value)} className="sey-input"><option value="private">Privat</option><option value="business">Gewerblich</option></select></Field>
                    <Field label="Vorname"><input value={contact.firstName} onChange={(e) => updateContact("firstName", e.target.value)} className="sey-input" /></Field>
                    <Field label="Nachname"><input value={contact.lastName} onChange={(e) => updateContact("lastName", e.target.value)} className="sey-input" /></Field>
                    <Field label={contact.customerType === "business" ? "Firma" : "Firma, falls gewerblich"}><input value={contact.company} onChange={(e) => updateContact("company", e.target.value)} className="sey-input" /></Field>
                    <Field label="E-Mail"><input type="email" value={contact.email} onChange={(e) => updateContact("email", e.target.value)} onBlur={checkEmailAccount} className="sey-input" /></Field>
                    <Field label="Telefon"><input value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} className="sey-input" /></Field>
                    <Field label="Straße und Hausnummer"><input value={contact.street} onChange={(e) => updateContact("street", e.target.value)} className="sey-input" /></Field>
                    <Field label="PLZ"><input value={contact.postalCode} onChange={(e) => updateContact("postalCode", e.target.value)} className="sey-input" /></Field>
                    <Field label="Ort"><input value={contact.city} onChange={(e) => updateContact("city", e.target.value)} className="sey-input" /></Field>
                  </div>
                  <Field label="Hinweise zur Baustelle, Zufahrt oder Abfallart"><textarea value={contact.message} onChange={(e) => updateContact("message", e.target.value)} className="sey-input min-h-24" /></Field>

                  {!REGISTRATION_ENABLED ? (
                    loggedInEmail ? (
                      <Notice tone="success">Angemeldet als {loggedInEmail}. Diese Anfrage erscheint in Ihrem Kundenkonto.</Notice>
                    ) : null
                  ) : loggedInEmail ? (
                    <Notice tone="success">Angemeldet als {loggedInEmail}. Diese Anfrage erscheint in Ihrem Kundenkonto.</Notice>
                  ) : emailAccountState === "exists" ? (
                    <div className="space-y-3">
                      <Notice tone="warning">Diese E-Mail-Adresse ist bereits registriert. Bitte melden Sie sich an, um die Anfrage Ihrem Konto zuzuordnen.</Notice>
                      <Field label="Passwort"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sey-input" /></Field>
                    </div>
                  ) : contact.customerType === "business" ? (
                    <div className="space-y-3">
                      <Notice tone="warning">Für Gewerbekunden ist ein Kundenkonto erforderlich, damit Anfragen und spätere Aufträge zugeordnet werden können.</Notice>
                      <Field label="Passwort (mind. 8 Zeichen)"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sey-input" /></Field>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Checkbox checked={wantsAccount} onChange={setWantsAccount}>Kundenkonto anlegen (optional) — damit sehen Sie diese und künftige Anfragen in Ihrem Konto.</Checkbox>
                      {wantsAccount && (
                        <Field label="Passwort (mind. 8 Zeichen)"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="sey-input" /></Field>
                      )}
                    </div>
                  )}
                </StepBlock>
              )}

              {step === "summary" && (
                <StepBlock title="Bitte prüfen Sie Ihre Angaben" intro="Wenn alles stimmt, senden Sie Ihre Anfrage zur Prüfung ab. Bei Sonderfällen, öffentlicher Stellfläche oder unklaren Angaben melden wir uns persönlich bei Ihnen.">
                  <div className="grid gap-3 text-sm text-zinc-700">
                    <SummaryRow label="Bereich" value={mode === "entsorgung" ? "Entsorgung" : mode === "baustoffe" ? "Baustoffe" : "Transport"} />
                    <SummaryRow label="Ort / Zone" value={`${postalCode} ${city}${zone ? ` · Zone ${zone}` : " · manuelle Prüfung"}`} />
                    <SummaryRow label="Auswahl" value={mode === "entsorgung" ? selectedWaste?.name : mode === "baustoffe" ? selectedMaterial?.name : transportDescription} />
                    {mode === "entsorgung" && <SummaryRow label="Containergröße" value={containerSize} />}
                    {mode === "baustoffe" && <SummaryRow label="Menge" value={`${quantity} ${selectedMaterial?.unit}`} />}
                    <SummaryRow label="Preishinweis" value={mode === "entsorgung" ? `Voraussichtlicher Transportanteil ab ${wasteTransportNet ? formatEuro(wasteTransportNet) : "Prüfung"} netto. Entsorgung nach tatsächlichem Gewicht${selectedWaste ? ` (${formatEuro(selectedWaste.netPrice)}/${selectedWaste.unit})` : ""}.` : mode === "baustoffe" ? `Richtwert ${materialTotalNet ? formatEuro(materialTotalNet) : "nach Prüfung"} netto inklusive Lieferanteil.` : "Individuelle Prüfung"} />
                    <SummaryRow label="Stellplatz" value={placement === "public" ? "öffentliche Fläche / Genehmigung klären" : placement === "private" ? "Privatgrundstück" : "noch unklar"} />
                  </div>
                  <div className="mt-5 grid gap-3">
                    <Notice tone="success">Mit dem Absenden entstehen keine Kosten. Seyfarth prüft Ihre Angaben und meldet sich zur Bestätigung von Preis, Termin und Verfügbarkeit.</Notice>
                    {requiresManualReview && <Notice tone="warning">Dieser Vorgang kann nicht automatisch bestätigt werden. Wegen Sonderfall, öffentlicher Stellfläche oder individueller Prüfung meldet sich Seyfarth persönlich bei Ihnen.</Notice>}
                    <Checkbox checked={privacyAccepted} onChange={setPrivacyAccepted}>Ich bin einverstanden, dass Seyfarth meine Angaben zur Bearbeitung der Anfrage nutzt. Die Datenschutzhinweise habe ich gelesen.</Checkbox>
                    {error && <Notice tone="danger">{error}</Notice>}
                  </div>
                </StepBlock>
              )}

              <div className="mt-8 border-t border-zinc-100 pt-5">
                {!canContinue() && <p className="mb-3 text-sm text-zinc-500">{continueHint()}</p>}
                <div className="flex items-center justify-between gap-3">
                  <Button type="button" variant="outline" onClick={goBack} disabled={step === "mode"} className="min-h-11 rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" />Zurück</Button>
                  {step !== "summary" ? (
                    <Button type="button" onClick={goNext} disabled={!canContinue()} className="min-h-11 rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy">
                      {step === "container" ? (<>In den Warenkorb legen<ShoppingCart className="ml-2 h-4 w-4" /></>) : (<>Weiter<ArrowRight className="ml-2 h-4 w-4" /></>)}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={!canContinue() || submitting} className="min-h-11 rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy">{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Anfrage zur Prüfung senden</Button>
                  )}
                </div>
              </div>
            </div>
          </form>

          <aside className="h-fit rounded-[32px] border border-zinc-100 bg-seyfarth-navy p-6 text-white shadow-xl lg:sticky lg:top-28">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-seyfarth-yellow">Ihre Auswahl</p>
            <div className="mt-5 space-y-4 text-sm text-blue-100">
              <SidebarItem label="Bereich" value={mode ? (mode === "entsorgung" ? "Entsorgung" : mode === "baustoffe" ? "Baustoffe" : "Transport") : "noch offen"} />
              <SidebarItem label="Liefergebiet" value={zone ? `Zone ${zone}` : postalCode ? "wird geprüft" : "noch offen"} />
              <SidebarItem label="Auswahl" value={mode === "entsorgung" ? selectedWaste?.name : mode === "baustoffe" ? selectedMaterial?.name : transportDescription || "noch offen"} />
              <SidebarItem label="Nächster Schritt" value="Seyfarth prüft persönlich" />
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-4 text-xs leading-relaxed text-blue-100">
              <strong className="text-white">Wichtiger Hinweis:</strong> Das Absenden der Anfrage ist kostenlos. Bei Entsorgungen wird der Abfall verwogen. Seyfarth bestätigt Preis, Termin und Verfügbarkeit persönlich.
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <a href="tel:03449155200" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-white hover:text-seyfarth-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-yellow"><Phone className="h-4 w-4" />034491 5520-0</a>
              <Link href="/datenschutz" className="inline-flex min-h-11 items-center rounded-lg px-2 text-xs text-blue-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-yellow">Datenschutz ansehen</Link>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function StepBlock({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <div><h3 className="font-headline text-2xl font-extrabold text-seyfarth-navy md:text-3xl">{title}</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{intro}</p><div className="mt-6 space-y-5">{children}</div></div>
}

function ChoiceCard({ active, icon: Icon, title, text, onClick }: { active: boolean; icon: React.ElementType; title: string; text: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "min-h-44 rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue",
        active ? "border-seyfarth-blue bg-seyfarth-blue text-white shadow-lg" : "border-zinc-200 bg-white text-seyfarth-navy",
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <Icon className={cx("h-8 w-8", active ? "text-seyfarth-yellow" : "text-seyfarth-blue")} />
        {active && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" />Ausgewählt</span>}
      </div>
      <p className="font-bold">{title}</p>
      <p className={cx("mt-2 text-sm leading-relaxed", active ? "text-blue-50" : "text-zinc-500")}>{text}</p>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</span>{children}</label>
}

function Notice({ tone, children }: { tone: "success" | "warning" | "danger"; children: React.ReactNode }) {
  return <div className={cx("rounded-2xl border p-4 text-sm leading-relaxed", tone === "success" && "border-green-200 bg-green-50 text-green-800", tone === "warning" && "border-amber-200 bg-amber-50 text-amber-800", tone === "danger" && "border-red-200 bg-red-50 text-red-800")}>{children}</div>
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-seyfarth-blue" /><span>{children}</span></label>
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex gap-4 rounded-2xl bg-zinc-50 p-3"><span className="w-32 shrink-0 text-xs font-bold uppercase tracking-[0.12em] text-zinc-400">{label}</span><span className="font-medium text-seyfarth-navy">{value || "noch offen"}</span></div>
}

function SidebarItem({ label, value }: { label: string; value?: string | null }) {
  return <div><p className="text-xs uppercase tracking-[0.16em] text-blue-300">{label}</p><p className="mt-1 font-semibold text-white">{value || "noch offen"}</p></div>
}

function MonthCalendar({
  month,
  onMonthChange,
  minDate,
  startValue,
  endValue,
  onSelect,
}: {
  month: Date
  onMonthChange: (next: Date) => void
  minDate: Date
  startValue: string
  endValue?: string
  onSelect: (iso: string) => void
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7 // Monday-first grid
  const cells: Array<Date | null> = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ]
  const minMonthStart = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const canGoPrev = firstOfMonth > minMonthStart

  return (
    <div className="w-full rounded-2xl border border-zinc-200 p-4 lg:max-w-[70%] lg:p-3">
      <div className="mb-3 flex items-center justify-between lg:mb-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          aria-label="Vorheriger Monat"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-seyfarth-navy hover:border-seyfarth-blue disabled:cursor-not-allowed disabled:opacity-30 lg:h-6 lg:w-6"
        >
          <ArrowLeft className="h-4 w-4 lg:h-3 lg:w-3" />
        </button>
        <p className="text-sm font-bold capitalize text-seyfarth-navy lg:text-xs">{month.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          aria-label="Nächster Monat"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-seyfarth-navy hover:border-seyfarth-blue lg:h-6 lg:w-6"
        >
          <ArrowRight className="h-4 w-4 lg:h-3 lg:w-3" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center lg:gap-0.5">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => (
          <span key={w} className="pb-1 text-[10px] font-bold uppercase text-zinc-400 lg:text-[8px]">{w}</span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />
          const iso = toLocalDateInputValue(date)
          const disabled = date < minDate || isNonWorkingDay(date)
          const isStart = iso === startValue
          const isEnd = !!endValue && iso === endValue
          const inRange = !!endValue && !!startValue && iso > startValue && iso < endValue
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(iso)}
              aria-pressed={isStart || isEnd}
              className={cx(
                "flex aspect-square items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seyfarth-blue lg:rounded-md lg:text-[11px]",
                disabled && "cursor-not-allowed bg-red-50 text-red-300",
                !disabled && !isStart && !isEnd && !inRange && "text-seyfarth-navy hover:bg-seyfarth-blue/10",
                inRange && "bg-seyfarth-blue/15 text-seyfarth-blue",
                (isStart || isEnd) && "bg-seyfarth-blue text-white",
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
