"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { medusa } from "@/lib/medusa"
import { PortalShell } from "@/components/portal/portal-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check, AlertTriangle, ShieldAlert } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

type Step = "location" | "container" | "waste" | "compliance" | "details" | "confirm"

interface WasteCode {
  id: string
  avv_number: string
  title: string
  category: string
  is_hazardous: boolean
  requires_trgs519: boolean
  requires_gewabfv_declaration: boolean
  warning_text?: string
  description?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("location")
  const [locations, setLocations] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [wasteCodes, setWasteCodes] = useState<WasteCode[]>([])

  // Selection state
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [selectedWasteCode, setSelectedWasteCode] = useState<WasteCode | null>(null)
  const [orderType, setOrderType] = useState("stellen")
  const [desiredDate, setDesiredDate] = useState("")
  const [notes, setNotes] = useState("")

  // Compliance state
  const [gewabfvJustificationType, setGewabfvJustificationType] = useState("")
  const [gewabfvJustificationText, setGewabfvJustificationText] = useState("")
  const [erzeugerNummer, setErzeugerNummer] = useState("")
  const [vollmachtAccepted, setVollmachtAccepted] = useState(false)
  const [legalConfirmed, setLegalConfirmed] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/store/delivery-locations`, { credentials: "include" })
      .then(r => r.json()).then(d => setLocations(d.delivery_locations || []))
    medusa.store.product.list({ limit: 20 })
      .then(({ products }) => setProducts(products))
    fetch(`${API_URL}/store/waste-codes`, { credentials: "include" })
      .then(r => r.json()).then(d => setWasteCodes(d.waste_codes || []))
  }, [])

  // Determine if compliance step is needed
  const needsCompliance = selectedWasteCode && (
    selectedWasteCode.requires_gewabfv_declaration ||
    selectedWasteCode.is_hazardous ||
    selectedWasteCode.requires_trgs519
  )

  const getNextStep = (current: Step): Step | null => {
    const order: Step[] = ["location", "container", "waste", "compliance", "details", "confirm"]
    const idx = order.indexOf(current)
    // Skip compliance step if not needed
    if (current === "waste" && !needsCompliance) return "details"
    if (idx < order.length - 1) return order[idx + 1]
    return null
  }

  const getPrevStep = (current: Step): Step | null => {
    const order: Step[] = ["location", "container", "waste", "compliance", "details", "confirm"]
    const idx = order.indexOf(current)
    // Skip compliance step backwards if not needed
    if (current === "details" && !needsCompliance) return "waste"
    if (idx > 0) return order[idx - 1]
    return null
  }

  const canProceed = (): boolean => {
    switch (step) {
      case "location": return !!selectedLocation
      case "container": return !!selectedProduct
      case "waste": return !!selectedWasteCode && (!selectedWasteCode.requires_trgs519)
      case "compliance":
        if (selectedWasteCode?.requires_gewabfv_declaration && !gewabfvJustificationType) return false
        if (selectedWasteCode?.is_hazardous && (!erzeugerNummer || !vollmachtAccepted)) return false
        return true
      case "details": return true
      case "confirm": return legalConfirmed
      default: return false
    }
  }

  const handleConfirm = async () => {
    // Submit GewAbfV declaration if needed
    if (selectedWasteCode?.requires_gewabfv_declaration) {
      await fetch(`${API_URL}/store/gewabfv-declarations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          delivery_location_id: selectedLocation.id,
          avv_number: selectedWasteCode.avv_number,
          is_separated: false,
          justification_type: gewabfvJustificationType,
          justification_text: gewabfvJustificationText || gewabfvJustificationType,
        }),
      })
    }

    // Create cart and order via Medusa
    try {
      const { cart } = await medusa.store.cart.create({})
      // Find matching variant from selected product
      const variant = selectedProduct?.variants?.[0]
      if (variant) {
        await medusa.store.cart.createLineItem(cart.id, {
          variant_id: variant.id,
          quantity: 1,
        })
      }
      await medusa.store.cart.update(cart.id, {
        metadata: {
          delivery_location_id: selectedLocation.id,
          delivery_location_name: selectedLocation.name,
          order_type: orderType,
          desired_date: desiredDate,
          avv_number: selectedWasteCode?.avv_number,
          waste_title: selectedWasteCode?.title,
          is_hazardous: selectedWasteCode?.is_hazardous,
          erzeuger_nummer: erzeugerNummer || undefined,
          notes,
        },
      })
    } catch (e) {
      // Cart creation may fail without full checkout setup -- OK for prototype
      console.log("Cart/order creation (prototype):", e)
    }

    router.push("/orders")
  }

  // Group waste codes by category
  const wasteCategories = wasteCodes.reduce((acc, wc) => {
    if (!acc[wc.category]) acc[wc.category] = []
    acc[wc.category].push(wc)
    return acc
  }, {} as Record<string, WasteCode[]>)

  return (
    <PortalShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Neuer Auftrag</h2>

        {/* Progress indicators */}
        <div className="flex gap-2 flex-wrap">
          {["location", "container", "waste", ...(needsCompliance ? ["compliance"] : []), "details", "confirm"].map((s) => (
            <Badge key={s} variant={step === s ? "default" : "outline"} className="text-xs">
              {s === "location" && "1. Lieferort"}
              {s === "container" && "2. Beh\u00e4lter"}
              {s === "waste" && "3. Abfallart"}
              {s === "compliance" && "4. Pflichten"}
              {s === "details" && `${needsCompliance ? "5" : "4"}. Details`}
              {s === "confirm" && `${needsCompliance ? "6" : "5"}. Best\u00e4tigung`}
            </Badge>
          ))}
        </div>

        {/* STEP: Lieferort */}
        {step === "location" && (
          <Card>
            <CardHeader><CardTitle>Lieferort w\u00e4hlen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {locations.length === 0 ? (
                <p className="text-muted-foreground">Keine Lieferorte vorhanden. Bitte zuerst einen anlegen.</p>
              ) : locations.map((loc: any) => (
                <div key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedLocation?.id === loc.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                  }`}>
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-sm text-muted-foreground">{loc.street}, {loc.zip_code} {loc.city}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* STEP: Beh\u00e4ltertyp */}
        {step === "container" && (
          <Card>
            <CardHeader><CardTitle>Beh\u00e4ltertyp w\u00e4hlen</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {products.map((p: any) => (
                <div key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                  }`}>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* STEP: Abfallart via AVV */}
        {step === "waste" && (
          <Card>
            <CardHeader><CardTitle>{"Abfallart w\u00e4hlen (AVV-Schl\u00fcssel)"}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(wasteCategories).map(([category, codes]) => (
                <div key={category}>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">{category}</h3>
                  <div className="space-y-2">
                    {codes.map((wc) => (
                      <div key={wc.id}
                        onClick={() => setSelectedWasteCode(wc)}
                        className={`p-4 border rounded-md cursor-pointer transition-colors ${
                          selectedWasteCode?.id === wc.id ? "border-primary bg-primary/5" : "hover:border-gray-400"
                        } ${wc.is_hazardous ? "border-l-4 border-l-red-500" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">
                              {wc.is_hazardous && <ShieldAlert className="h-4 w-4 inline mr-1 text-red-500" />}
                              {wc.title}
                            </p>
                            <p className="text-xs text-muted-foreground">AVV {wc.avv_number}</p>
                            {wc.description && <p className="text-sm mt-1">{wc.description}</p>}
                          </div>
                          {wc.is_hazardous && <Badge variant="destructive" className="text-xs">{"Gef\u00e4hrlich"}</Badge>}
                          {wc.requires_gewabfv_declaration && !wc.is_hazardous && <Badge variant="secondary" className="text-xs">GewAbfV</Badge>}
                        </div>
                        {wc.warning_text && selectedWasteCode?.id === wc.id && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm flex gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <span>{wc.warning_text}</span>
                          </div>
                        )}
                        {wc.requires_trgs519 && selectedWasteCode?.id === wc.id && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm">
                            <strong>TRGS 519 Sachkundenachweis erforderlich.</strong>{" "}
                            {"Upload-Funktion wird in Phase 2 bereitgestellt. Bestellung derzeit nicht m\u00f6glich."}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* STEP: Compliance (conditional) */}
        {step === "compliance" && selectedWasteCode && (
          <Card>
            <CardHeader><CardTitle>Erzeuger-Pflichten</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* GewAbfV Declaration */}
              {selectedWasteCode.requires_gewabfv_declaration && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      {"GewAbfV-Erkl\u00e4rung erforderlich"}
                    </h3>
                    <p className="text-sm mt-1">{"Bei gemischten Gewerbeabf\u00e4llen m\u00fcssen Sie begr\u00fcnden, warum eine getrennte Sammlung nicht m\u00f6glich ist."}</p>
                  </div>
                  <div>
                    <Label>{"Begr\u00fcndung der Nicht-Trennung *"}</Label>
                    <div className="space-y-2 mt-2">
                      {[
                        { value: "technical", label: "Technisch nicht m\u00f6glich (z.B. Platzmangel auf der Baustelle)" },
                        { value: "economic", label: "Wirtschaftlich unzumutbar (z.B. Menge < 1m\u00b3 pro Fraktion)" },
                        { value: "other", label: "Andere Begr\u00fcndung" },
                      ].map((opt) => (
                        <label key={opt.value} className={`flex items-start gap-3 p-3 border rounded cursor-pointer ${
                          gewabfvJustificationType === opt.value ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                        }`}>
                          <input type="radio" name="justification" value={opt.value}
                            checked={gewabfvJustificationType === opt.value}
                            onChange={() => setGewabfvJustificationType(opt.value)}
                            className="mt-1" />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {gewabfvJustificationType === "other" && (
                    <div>
                      <Label>{"Begr\u00fcndung (Freitext) *"}</Label>
                      <Input value={gewabfvJustificationText}
                        onChange={(e) => setGewabfvJustificationText(e.target.value)}
                        placeholder="Bitte beschreiben Sie, warum eine Trennung nicht m\u00f6glich ist..." />
                    </div>
                  )}
                </div>
              )}

              {/* Hazardous waste: Erzeugernummer + Vollmacht */}
              {selectedWasteCode.is_hazardous && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      {"Gef\u00e4hrlicher Abfall \u2014 Zus\u00e4tzliche Angaben"}
                    </h3>
                    <p className="text-sm mt-1">{"Als Abfallerzeuger ben\u00f6tigen Sie eine Erzeugernummer und m\u00fcssen die eANV-Vertretung durch den Entsorger bevollm\u00e4chtigen."}</p>
                  </div>
                  <div>
                    <Label>{"Erzeugernummer (Beh\u00f6rde) *"}</Label>
                    <Input value={erzeugerNummer}
                      onChange={(e) => setErzeugerNummer(e.target.value)}
                      placeholder="z.B. E12345678" />
                  </div>
                  <label className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input type="checkbox" checked={vollmachtAccepted}
                      onChange={(e) => setVollmachtAccepted(e.target.checked)}
                      className="mt-1" />
                    <span className="text-sm">
                      {"Ich bevollm\u00e4chtige den Entsorger, mich im elektronischen Abfallnachweisverfahren (eANV) zu vertreten. "}
                      {"Ich best\u00e4tige, dass ich als Abfallerzeuger die Verantwortung f\u00fcr die korrekte Deklaration der Abf\u00e4lle trage."}
                    </span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP: Details */}
        {step === "details" && (
          <Card>
            <CardHeader><CardTitle>Auftragsdetails</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Auftragsart</Label>
                <div className="flex gap-2 mt-1">
                  {["stellen", "abholen", "wechseln", "umladen"].map((t) => (
                    <Button key={t} variant={orderType === t ? "default" : "outline"}
                      onClick={() => setOrderType(t)} className="capitalize">
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Wunschtermin</Label>
                <Input type="date" value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <Label>Bemerkungen</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sonderw\u00fcnsche, Zufahrtshinweise..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP: Bestaetigung */}
        {step === "confirm" && (
          <Card>
            <CardHeader><CardTitle>Zusammenfassung</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <p className="text-muted-foreground">Lieferort:</p>
                <p>{selectedLocation?.name} {"\u2014"} {selectedLocation?.city}</p>
                <p className="text-muted-foreground">{"Beh\u00e4lter:"}</p>
                <p>{selectedProduct?.title}</p>
                <p className="text-muted-foreground">Abfallart:</p>
                <p>{selectedWasteCode?.title} (AVV {selectedWasteCode?.avv_number})</p>
                {selectedWasteCode?.is_hazardous && <>
                  <p className="text-muted-foreground">Erzeugernummer:</p>
                  <p>{erzeugerNummer}</p>
                </>}
                <p className="text-muted-foreground">Auftragsart:</p>
                <p className="capitalize">{orderType}</p>
                <p className="text-muted-foreground">Wunschtermin:</p>
                <p>{desiredDate || "Kein Wunschtermin"}</p>
                {notes && <>
                  <p className="text-muted-foreground">Bemerkungen:</p>
                  <p>{notes}</p>
                </>}
              </div>

              <div className="border-t pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={legalConfirmed}
                    onChange={(e) => setLegalConfirmed(e.target.checked)}
                    className="mt-1" />
                  <span className="text-sm">
                    {"Ich best\u00e4tige die Richtigkeit meiner Angaben. Mir ist bewusst, dass ich als Abfallerzeuger "}
                    {"f\u00fcr die korrekte Deklaration der Abf\u00e4lle verantwortlich bin und bei Falschdeklaration hafte."}
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          {getPrevStep(step) ? (
            <Button variant="outline" onClick={() => setStep(getPrevStep(step)!)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> {"Zur\u00fcck"}
            </Button>
          ) : <div />}
          {getNextStep(step) ? (
            <Button onClick={() => setStep(getNextStep(step)!)} disabled={!canProceed()}>
              Weiter <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleConfirm} disabled={!canProceed()}>
              <Check className="h-4 w-4 mr-2" /> {"Auftrag best\u00e4tigen"}
            </Button>
          )}
        </div>
      </div>
    </PortalShell>
  )
}
