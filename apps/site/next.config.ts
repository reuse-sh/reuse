import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/how-to-use", destination: "/for-agents", permanent: true },
      { source: "/:library/agent", destination: "/:library", permanent: true },
      {
        source: "/gradients",
        destination: "/easing-gradients",
        permanent: true,
      },
      {
        source: "/shadows/guides/fade-edge",
        destination: "/easing-gradients/examples/fade-edge",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
