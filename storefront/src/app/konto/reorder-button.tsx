"use client"

import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const REORDER_KEY = "seyfarth-reorder"

// Hands a past request's stored payload to the configurator via localStorage
// (too large and structured for a query param) and jumps to it. The
// configurator picks it up on mount, prefills its steps, and clears the key.
export function ReorderButton({ payload }: { payload: unknown }) {
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-lg"
      onClick={() => {
        try {
          localStorage.setItem(REORDER_KEY, JSON.stringify(payload))
        } catch {
          // localStorage unavailable (private mode) — fall through to the
          // configurator, the customer can still fill it in manually.
        }
        router.push("/#katalog")
      }}
    >
      <RotateCcw className="mr-2 h-4 w-4" />
      Nochmal anfragen
    </Button>
  )
}
