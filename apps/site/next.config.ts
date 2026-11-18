import { withCn } from "cn/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The themes page renders per request and reads the theme files that the build copies here.
  outputFileTracingIncludes: {
    "/[library]/themes": ["./public/modules/lightbox/themes/*.css"],
  },
};
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
