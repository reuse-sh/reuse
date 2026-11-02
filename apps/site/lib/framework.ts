export type Framework = "react" | "html";

export type DocSearch = {
  framework?: string | string[];
  view?: string | string[];
  file?: string | string[];
};

export function frameworkFrom(value: unknown): Framework {
  return value === "html" ? "html" : "react";
}

export function frameworkHref(href: string, framework: Framework) {
  if (framework === "react") return href;
  const [path, hash] = href.split("#");
  return `${path}${path.includes("?") ? "&" : "?"}framework=html${hash ? `#${hash}` : ""}`;
}
