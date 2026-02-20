import { PublicShell } from "@/components/public/public-shell"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Mail } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <PublicShell>
      <div className="max-w-xl mx-auto px-6 py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="h-10 w-10 text-green-600" strokeWidth={1.5} />
        </div>

        <h1 className="text-3xl font-bold text-seyfarth-navy mb-4">
          Vielen Dank für Ihren Auftrag!
        </h1>

        <p className="text-lg text-zinc-600 mb-6">
          Wir haben Ihre Anfrage erhalten und melden uns zeitnah zur Terminabstimmung.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 mb-10">
          <Mail className="h-4 w-4" />
          <span>Eine Bestätigung wurde an Ihre E-Mail-Adresse gesendet.</span>
        </div>

        <Button asChild className="bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full px-8">
          <Link href="/">Zurück zum Shop</Link>
        </Button>
      </div>
    </PublicShell>
  )
}
