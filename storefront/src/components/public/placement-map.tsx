"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Default view: Seyfarth's core delivery area around Ponitz/Altenburg.
const DEFAULT_CENTER: [number, number] = [50.88, 12.35]

export type LatLng = { lat: number; lng: number }

// A CSS marker so we don't pull Leaflet's default icon PNGs from an external
// path (keeps the CSP img-src to OSM tiles only).
const pinIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2563eb;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:rotate(-45deg);margin:-11px 0 0 -11px"></div>',
  iconSize: [22, 22],
  iconAnchor: [0, 0],
})

export default function PlacementMap({
  value,
  onChange,
}: {
  value: LatLng | null
  onChange: (v: LatLng) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current).setView(value ? [value.lat, value.lng] : DEFAULT_CENTER, value ? 17 : 12)
    mapRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map)

    const place = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map)
        marker.on("dragend", () => {
          const p = marker.getLatLng()
          onChangeRef.current({ lat: p.lat, lng: p.lng })
        })
        markerRef.current = marker
      }
      onChangeRef.current({ lat, lng })
    }

    if (value) place(value.lat, value.lng)
    map.on("click", (e: L.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng))

    // Leaflet needs a size recalculation once it's actually visible in layout.
    setTimeout(() => map.invalidateSize(), 0)

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const locateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      mapRef.current?.setView([latitude, longitude], 18)
      if (markerRef.current) markerRef.current.setLatLng([latitude, longitude])
      else {
        const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(mapRef.current!)
        marker.on("dragend", () => {
          const p = marker.getLatLng()
          onChangeRef.current({ lat: p.lat, lng: p.lng })
        })
        markerRef.current = marker
      }
      onChangeRef.current({ lat: latitude, lng: longitude })
    })
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-64 w-full overflow-hidden rounded-2xl border border-zinc-200" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          Tippen Sie auf die Karte, um den genauen Abstellort zu setzen – oder ziehen Sie die Markierung.
        </p>
        <button
          type="button"
          onClick={locateMe}
          className="shrink-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-seyfarth-blue hover:border-seyfarth-blue"
        >
          Meine Position
        </button>
      </div>
    </div>
  )
}
