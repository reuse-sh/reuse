import { docHref, docPages, libraries } from "@reuse-sh/catalog";
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/for-agents",
    ...libraries.flatMap((library) =>
      docPages(library).map((page) => docHref(library, page.path)),
    ),
  ].map((path) => ({ url: `https://reuse.sh${path}` }));
}
