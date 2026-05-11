import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "containerdienst-seyfarth.onepage.me" },
      { protocol: "https", hostname: "www.containerdienst-seyfarth.de" },
      { protocol: "https", hostname: "onecdn.io" },
    ],
  },
};

export default nextConfig;
