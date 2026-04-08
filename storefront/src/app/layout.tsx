import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";
// CookieBanner ist in PublicShell — wird NICHT auf /embed geladen

export const metadata: Metadata = {
  title: "Seyfarth Container-Dienst — Containerbestellung online",
  description: "Container bestellen bei Seyfarth Container-Dienst. Absetz- und Abrollcontainer, fachgerechte Entsorgung, zertifizierter Entsorgungsfachbetrieb in Ponitz.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
