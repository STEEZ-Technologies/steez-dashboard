import type { NextConfig } from "next";
import path from "path";

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
};

export default nextConfig;
