import { type Library, libraries } from "@reuse-sh/catalog";

export const menuGroups = [
  ["Media", ["lightbox", "carousel", "annotations"]],
  [
    "Interface",
    ["avatars", "floating-tooltip", "moving-highlight", "hold-to-confirm"],
  ],
  ["Motion and style", ["loaders", "shadows"]],
] as const;

export type MenuSlug = (typeof menuGroups)[number][1][number];

export const shortLines: Record<MenuSlug, string> = {
  lightbox: "Full-screen photos with zoom",
  carousel: "A scroll-snap strip of slides",
  annotations: "Marks and notes on images",
  avatars: "Faces, badges and groups",
  "floating-tooltip": "A hint that follows the pointer",
  "moving-highlight": "A surface that follows focus",
  "hold-to-confirm": "Press and hold for risky actions",
  loaders: "Dot figures that change shape",
  shadows: "Two-layer depth with a fine edge",
};

const bySlug = new Map<string, Library>(
  libraries.map((library) => [library.slug, library]),
);

export function menuLibrary(slug: MenuSlug) {
  const library = bySlug.get(slug);
  if (!library) throw new Error(`The catalog has no library "${slug}".`);
  return library;
}

export function libraryAt(pathname: string | null) {
  const slug = pathname?.split("/")[1];
  return (slug && bySlug.get(slug)) || null;
}
