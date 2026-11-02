import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: { "/*": ["./examples/**/*"] },
};

export default nextConfig;
