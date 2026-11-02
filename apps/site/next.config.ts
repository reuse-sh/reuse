import { withCn } from "cn/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = { poweredByHeader: false };
export default withCn(nextConfig, {
  cwd: import.meta.dirname,
  content: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "examples/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
  ],
  css: "app/globals.css",
  out: ".cn/tables.mjs",
});
