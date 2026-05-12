"use client"

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCheck,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  Recycle,
  ShieldAlert,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  REQUEST_FORM_VERSION,
  ShopMode,
  PlacementType,
  containerSizes,
  formatEuro,
  getTransportPrice,
  lookupZone,
  materialItems,
  wasteItems,
} from "@/lib/seyfarth-shop-data"

type Step = "mode" | "location" | "selection" | "container" | "placement" | "dates" | "contact" | "summary"

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

const emptyContact = {
  customerType: "private",
  name: "",
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
  const [postalCode, setPostalCode] = useState("")
  const [city, setCity] = useState("")
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
  const successRef = useRef<HTMLElement | null>(null)

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
      case "contact": return !!(contact.name && contact.email && contact.phone && contact.street && contact.postalCode && contact.city)
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
      case "contact": return "Bitte füllen Sie die Pflichtfelder für die Kontaktaufnahme aus."
      case "summary": return "Bitte bestätigen Sie die Datenschutzhinweise."
      default: return "Bitte vervollständigen Sie die Angaben."
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!privacyAccepted) return
    setSubmitting(true)
    setError(null)
    const payload = {
      requestFormVersion: REQUEST_FORM_VERSION,
      mode,
      intent: "inquiry",
      location: { postalCode, city, zone: zone ?? null, zoneKnown: !!zoneMatch },
      selection: mode === "entsorgung" ? selectedWaste : mode === "baustoffe" ? selectedMaterial : { description: transportDescription },
      containerSize: mode === "entsorgung" ? containerSize : undefined,
      quantity: mode === "baustoffe" ? { value: materialQuantity, unit: selectedMaterial?.unit } : undefined,
      placement: { type: placement, permitAccepted, safetyAccepted },
      dates: { deliveryDate, pickupDate, flexibility: dateFlexibility },
      pricing: { transportNet: transportPrice, materialNet, materialTotalNet, wasteDisposalNetPerUnit: selectedWaste?.netPrice, finalByWeighing: selectedWaste?.requiresWeighing },
      contact,
      confirmations: { privacyAccepted, submittedNoticeVersion: REQUEST_FORM_VERSION },
    }

    try {
      const response = await fetch("/api/shop-requests", {
        method: "POST",
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
                  <div className="grid gap-4 md:grid-cols-3">
                    <ChoiceCard active={mode === "entsorgung"} icon={Recycle} title="Entsorgung" text="Container für Bauschutt, Sperrmüll, Holz, Grünschnitt und weitere Abfälle anfragen." onClick={() => setMode("entsorgung")} />
                    <ChoiceCard active={mode === "baustoffe"} icon={Package} title="Baustoffe" text="Schüttgut oder Recyclingmaterial liefern lassen – Preis abhängig von Menge und Lieferort." onClick={() => setMode("baustoffe")} />
                    <ChoiceCard active={mode === "transport"} icon={Truck} title="Transport" text="Transportleistung mit Abholort, Zielort und gewünschtem Zeitraum anfragen." onClick={() => setMode("transport")} />
                  </div>
                </StepBlock>
              )}

              {step === "location" && (
                <StepBlock title="Wo soll der Container stehen oder Material geliefert werden?" intro="Mit PLZ und Ort prüfen wir, ob Ihr Standort im Liefergebiet liegt und welche Transportzone gilt.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Postleitzahl"><input value={postalCode} onChange={(e) => { setPostalCode(e.target.value); updateContact("postalCode", e.target.value) }} className="sey-input" placeholder="z. B. 04639" /></Field>
                    <Field label="Ort"><input value={city} onChange={(e) => { setCity(e.target.value); updateContact("city", e.target.value) }} className="sey-input" placeholder="z. B. Ponitz" /></Field>
                  </div>
                  {zoneMatch && (
                    <Notice tone="success">
                      Gute Nachricht: {zoneMatch.city} liegt in unserem Liefergebiet, Zone {zoneMatch.zone}. Den genauen Transportanteil berücksichtigen wir in Ihrer Anfrage.
                    </Notice>
                  )}
                </StepBlock>
              )}

              {step === "selection" && mode === "entsorgung" && (
                <StepBlock title="Welche Abfallart möchten Sie entsorgen?" intro="Bitte wählen Sie möglichst genau aus. Bei Asbest, Mineralwolle, teerhaltiger Dachpappe oder anderen Sonderfällen prüfen wir Ihre Anfrage vorab persönlich.">
                  <div className="grid gap-3 md:grid-cols-2">
                    {wasteItems.map((item) => (
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
                          <div><p className="font-bold text-seyfarth-navy">{item.name}</p><p className="text-xs text-zinc-500">Abfallschlüssel: ASN {item.avv} · Entsorgung nach Gewicht: {formatEuro(item.netPrice)} netto/{item.unit}</p></div>
                          <div className="flex items-center gap-2">
                            {selectedWasteId === item.id && <span className="inline-flex items-center gap-1 rounded-full bg-seyfarth-blue px-2 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" />Ausgewählt</span>}
                            {item.isHazardous && <ShieldAlert className="h-5 w-5 text-red-500" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {selectedWaste?.notice && <Notice tone="danger">{selectedWaste.notice} Verpackung/Hinweis: {selectedWaste.packaging}.</Notice>}
                </StepBlock>
              )}

              {step === "selection" && mode === "baustoffe" && (
                <StepBlock title="Welches Material benötigen Sie?" intro="Wählen Sie das Material aus. Menge und Lieferort werden als Grundlage für Ihre Anfrage berücksichtigt.">
                  <div className="grid gap-3 md:grid-cols-2">
                    {materialItems.map((item) => (
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
                          <div><p className="font-bold text-seyfarth-navy">{item.name}</p><p className="text-xs text-zinc-500">{item.specification} · {formatEuro(item.netPrice)} netto/{item.unit}</p></div>
                          {selectedMaterialId === item.id && <span className="inline-flex items-center gap-1 rounded-full bg-seyfarth-blue px-2 py-1 text-xs font-bold text-white"><Check className="h-3 w-3" />Ausgewählt</span>}
                        </div>
                      </button>
                    ))}
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
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    {containerSizes.map((size) => (
                      <button key={size} type="button" onClick={() => setContainerSize(size)} className={cx("rounded-2xl border px-4 py-3 text-sm font-bold", containerSize === size ? "border-seyfarth-blue bg-seyfarth-blue text-white" : "border-zinc-200 bg-white text-seyfarth-navy")}>{size}</button>
                    ))}
                  </div>
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
                </StepBlock>
              )}

              {step === "dates" && (
                <StepBlock title="Wann wünschen Sie Lieferung und Abholung?" intro="Bitte nennen Sie Ihre Wunschtermine. Wir bestätigen telefonisch oder per E-Mail, ob diese möglich sind.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Gewünschtes Lieferdatum"><input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="sey-input" /></Field>
                    {mode === "entsorgung" && <Field label="Gewünschtes Abholdatum"><input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="sey-input" /></Field>}
                  </div>
                  <Field label="Terminflexibilität"><select value={dateFlexibility} onChange={(e) => setDateFlexibility(e.target.value)} className="sey-input"><option>telefonisch abstimmen</option><option>Datum ist fest</option><option>Ich bin flexibel</option></select></Field>
                </StepBlock>
              )}

              {step === "contact" && (
                <StepBlock title="Wohin dürfen wir das Angebot senden?" intro="Wir nutzen Ihre Angaben nur zur Bearbeitung dieser Anfrage.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Kundentyp"><select value={contact.customerType} onChange={(e) => updateContact("customerType", e.target.value)} className="sey-input"><option value="private">Privat</option><option value="business">Gewerblich</option></select></Field>
                    <Field label="Name"><input value={contact.name} onChange={(e) => updateContact("name", e.target.value)} className="sey-input" /></Field>
                    <Field label="Firma, falls gewerblich"><input value={contact.company} onChange={(e) => updateContact("company", e.target.value)} className="sey-input" /></Field>
                    <Field label="E-Mail"><input type="email" value={contact.email} onChange={(e) => updateContact("email", e.target.value)} className="sey-input" /></Field>
                    <Field label="Telefon"><input value={contact.phone} onChange={(e) => updateContact("phone", e.target.value)} className="sey-input" /></Field>
                    <Field label="Straße und Hausnummer"><input value={contact.street} onChange={(e) => updateContact("street", e.target.value)} className="sey-input" /></Field>
                    <Field label="PLZ"><input value={contact.postalCode} onChange={(e) => updateContact("postalCode", e.target.value)} className="sey-input" /></Field>
                    <Field label="Ort"><input value={contact.city} onChange={(e) => updateContact("city", e.target.value)} className="sey-input" /></Field>
                  </div>
                  <Field label="Hinweise zur Baustelle, Zufahrt oder Abfallart"><textarea value={contact.message} onChange={(e) => updateContact("message", e.target.value)} className="sey-input min-h-24" /></Field>
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
                    <Button type="button" onClick={goNext} disabled={!canContinue()} className="min-h-11 rounded-xl bg-seyfarth-blue text-white hover:bg-seyfarth-navy">Weiter<ArrowRight className="ml-2 h-4 w-4" /></Button>
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
