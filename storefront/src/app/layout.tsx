import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
