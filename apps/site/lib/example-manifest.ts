import prefixMap from "./example-prefixes.json";

const prefixes: Record<string, string> = prefixMap;

export function recipeId(slug: string, path: string) {
  const prefix = prefixes[slug] ?? slug;
  if (path === "getting-started") return `${prefix}-start`;
  if (path.startsWith("examples/")) return `${prefix}-${path.slice(9)}`;
  if (slug === "carousel" && path === "guides/controls")
    return "carousel-controls";
  if (slug === "annotations" && path === "guides/data-format")
    return "annotations-data-format";
  if (slug === "easing-gradients" && path === "guides/easing-curves")
    return "gradients-easing-curves";
  return null;
}
