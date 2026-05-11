import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { CartProvider } from "@/lib/cart";

export const metadata: Metadata = {
  title: "Seyfarth Container-Dienst — Container online anfragen",
  description: "Container, Baustoffe und Transport bei Seyfarth online anfragen. Mit persönlicher Prüfung von Preis, Termin, Stellplatz und Entsorgungshinweisen.",
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
