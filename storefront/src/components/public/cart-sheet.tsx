"use client"
import { useCart } from "@/lib/cart"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { ShoppingCart, X, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

function formatPrice(cents: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100)
}

interface CartSheetProps {
  /** Basis-Pfad für Checkout — Standard "/" für normalen Shop, "/embed" im iframe */
  checkoutBasePath?: string
}

export function CartSheet({ checkoutBasePath = "" }: CartSheetProps) {
  const { items, removeItem, itemCount, total } = useCart()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="relative p-2 rounded-full transition-colors hover:bg-zinc-100"
          aria-label="Warenkorb öffnen"
        >
          <ShoppingCart className="h-5 w-5 text-zinc-800" strokeWidth={1.5} />
          {itemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-[18px] min-w-[18px] px-0.5 rounded-full bg-seyfarth-navy text-white text-[11px] leading-[18px] flex items-center justify-center font-semibold">
              {itemCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            Warenkorb {itemCount > 0 && <span className="text-zinc-400 font-normal">({itemCount})</span>}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingCart className="h-12 w-12 text-zinc-300 mb-4" strokeWidth={1} />
            <p className="text-zinc-500 mb-4">Ihr Warenkorb ist leer</p>
            <Button variant="outline" onClick={() => setOpen(false)} asChild>
              <Link href="/#katalog">Zum Katalog</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 px-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.productTitle}</p>
                    <p className="text-xs text-zinc-500">{item.variantTitle}</p>
                    <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Gesamt</span>
                  <span className="font-semibold text-lg">{formatPrice(total)}</span>
                </div>
                <Button
                  className="w-full bg-seyfarth-blue hover:bg-seyfarth-navy text-white rounded-full"
                  onClick={() => setOpen(false)}
                  asChild
                >
                  <Link href={`${checkoutBasePath}/checkout`}>
                    Zur Kasse <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
