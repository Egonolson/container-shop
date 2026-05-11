import type { MetadataRoute } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://containerdienst-seyfarth.onepage.me"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/orders", "/login", "/registrieren"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
