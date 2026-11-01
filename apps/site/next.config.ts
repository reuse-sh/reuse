import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/how-to-use", destination: "/for-agents", permanent: true },
    ];
  },
};

export default nextConfig;
