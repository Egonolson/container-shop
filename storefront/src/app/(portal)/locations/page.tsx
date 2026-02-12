"use client"
import { useEffect, useState } from "react"
import { PortalShell } from "@/components/portal/portal-shell"
import { LocationForm } from "@/components/portal/location-form"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface DeliveryLocation {
  id: string
  name: string
  street: string
  zip_code: string
  city: string
  contact_person?: string
  contact_phone?: string
  notes?: string
}

const API_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000"

export default function LocationsPage() {
  const [locations, setLocations] = useState<DeliveryLocation[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchLocations = async () => {
    const res = await fetch(`${API_URL}/store/delivery-locations`, { credentials: "include" })
    const data = await res.json()
    setLocations(data.delivery_locations || [])
  }

  useEffect(() => { fetchLocations() }, [])

  const handleCreated = () => {
    setDialogOpen(false)
    fetchLocations()
  }

  const handleDelete = async (id: string) => {
    await fetch(`${API_URL}/store/delivery-locations/${id}`, {
      method: "DELETE",
      credentials: "include",
    })
    fetchLocations()
  }

  return (
    <PortalShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Lieferorte</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Neuer Lieferort</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neuen Lieferort anlegen</DialogTitle>
              </DialogHeader>
              <LocationForm onSuccess={handleCreated} />
            </DialogContent>
          </Dialog>
        </div>

        {locations.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Noch keine Lieferorte angelegt.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => (
              <Card key={loc.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{loc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {loc.street}, {loc.zip_code} {loc.city}
                      </p>
                      {loc.contact_person && (
                        <p className="text-sm mt-1">Ansprechpartner: {loc.contact_person}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(loc.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  )
}
