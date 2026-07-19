import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
