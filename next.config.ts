import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy.
//
// Honest scope: 'unsafe-inline' on script-src is unavoidable without moving to
// nonce-based CSP in middleware (Next's RSC hydration payload and the chart /
// DnD libraries all inject inline script and style). So this does NOT stop an
// injected inline <script>. What it does buy, and the reason it's worth having:
//
//   - script-src 'self'  → an injected <script src="//evil.com"> won't load
//   - connect-src        → exfiltration to an attacker's host is blocked
//   - form-action 'self' → a planted <form> can't POST credentials offsite
//   - base-uri 'self'    → blocks <base> tag hijacking of every relative URL
//   - object-src 'none'  → no Flash/embed vectors
//   - frame-ancestors    → clickjacking (also covered by X-Frame-Options)
//
// img-src allows any https host because product photos are served from the
// client's own domain today and will move to an OSS/CDN domain later; keeping
// it broad avoids silently breaking catalog images on a domain change.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // ws: is the Turbopack HMR socket — dev only.
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
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
