import { docSections, libraries } from "@reuse-sh/catalog";
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/how-to-use",
    "/for-agents",
    ...libraries.flatMap((library) => [
      `/${library.slug}`,
      ...docSections.map((section) => `/${library.slug}/${section.slug}`),
    ]),
  ].map((path) => ({ url: `https://reuse.sh${path}` }));
}
