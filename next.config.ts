import type { NextConfig } from "next";
import path from "path";

// CSP is deliberately not set here — Next.js's RSC hydration payload and
// several chart/DnD libraries in this app need inline script/style, and
// getting a strict policy right needs live testing against every page
// rather than guessing blind. The rest of these are zero-risk.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // ali-oss's urllib dependency has an optional lazy require('proxy-agent')
  // that Turbopack tries to statically resolve and fails on. Externalizing
  // keeps it as a plain Node require at runtime instead of being bundled.
  // ali-oss: urllib's lazy require('proxy-agent') breaks Turbopack bundling.
  // geoip-lite: reads a bundled binary MaxMind DB from disk at runtime.
  serverExternalPackages: ["ali-oss", "geoip-lite"],
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
