// Embed-Layout: Lädt Albert Sans (gleiche Schrift wie onepage.me)
// Kein Header, kein Footer, kein Cookie-Banner
// Body-Background wird von data-embed überschrieben

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Albert Sans — gleiche Schrift wie containerdienst-seyfarth.onepage.me */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        /* ============================================
           EMBED-MODUS — alle Seiten unter /embed/*
           ============================================ */

        /* onepage.me Font angleichen */
        [data-embed], [data-embed] * {
          font-family: 'Albert Sans', -apple-system, system-ui, sans-serif !important;
        }

        /* Seiten-Hintergrund */
        html, body {
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          background: #fff;
        }

        /* PublicShell Header/Footer ausblenden (falls Seiten PublicShell nutzen) */
        /* Ausnahme: der EmbedCartBar-Header hat data-embed-bar und bleibt sichtbar */
        [data-embed] footer,
        [data-embed] [data-cookie-banner],
        [data-embed] .seyfarth-public-header {
          display: none !important;
        }

        /* Embed-Farben an onepage.me angleichen */
        [data-embed] {
          --color-seyfarth-navy: #071B3B;
          --color-seyfarth-blue: #2579F0;
          --color-seyfarth-yellow: #FEC43E;
          --color-seyfarth-orange: #FEC43E;
        }

        /* Kategorie-Kacheln: Farben angleichen */
        [data-embed] .bg-seyfarth-navy { background-color: #071B3B !important; }
        [data-embed] .text-seyfarth-navy { color: #071B3B !important; }
        [data-embed] .text-seyfarth-yellow { color: #FEC43E !important; }
        [data-embed] .bg-seyfarth-orange,
        [data-embed] .hover\\:bg-seyfarth-yellow { background-color: #FEC43E !important; color: #071B3B !important; }
        [data-embed] .border-seyfarth-navy { border-color: #071B3B !important; }

        /* Kein Scroll-Rand */
        [data-embed] { min-height: auto; }
      `}</style>
      {children}
    </>
  )
}
