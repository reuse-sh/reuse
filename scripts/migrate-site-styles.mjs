import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(
  new URL("../apps/site/package.json", import.meta.url),
);
const postcss = require("postcss");
const root = new URL("../", import.meta.url);
const owned = [
  "apps/site/app/page.tsx",
  "apps/site/app/tools/page.tsx",
  "apps/site/app/for-agents/page.tsx",
  "apps/site/components/shell/site-header.tsx",
  "apps/site/components/shell/site-footer.tsx",
];
async function files(directory) {
  const entries = await readdir(new URL(directory, root), {
    withFileTypes: true,
  });
  return (
    await Promise.all(
      entries.map((entry) => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? files(path) : path;
      }),
    )
  ).flat();
}
owned.push(
  ...(await files("apps/site/components/home")),
  ...(await files("apps/site/components/demos")),
);
const siteFiles = [
  ...(await files("apps/site/components")),
  ...(await files("apps/site/app")),
].filter((file) => /\.(tsx|ts)$/.test(file));
const sources = new Map(
  await Promise.all(
    siteFiles.map(async (file) => [
      file,
      await readFile(new URL(file, root), "utf8"),
    ]),
  ),
);
const shared = new Set(
  "c-col c-sec c-display c-h1 c-h2 c-sub c-h3 c-text c-gray c-card c-card-in c-feats c-feats-3".split(
    " ",
  ),
);
const shell = new Set(
  "c-head-in c-logo c-slash c-switch c-switch-chevron c-foot c-foot-in c-foot-logo".split(
    " ",
  ),
);
const values = {
  display: {
    flex: "flex",
    grid: "grid",
    block: "block",
    "inline-flex": "inline-flex",
  },
  "align-items": {
    center: "items-center",
    baseline: "items-baseline",
    start: "items-start",
  },
  "justify-content": {
    center: "justify-center",
    "space-between": "justify-between",
  },
  "align-self": { center: "self-center" },
  "place-items": { center: "place-items-center" },
  "justify-items": { center: "justify-items-center" },
  "flex-direction": { column: "flex-col", row: "flex-row" },
  "flex-wrap": { wrap: "flex-wrap" },
  position: { relative: "relative", absolute: "absolute", sticky: "sticky" },
  "text-align": { center: "text-center" },
  "text-wrap": { pretty: "text-pretty", balance: "text-balance" },
  "font-variant-numeric": { "tabular-nums": "tabular-nums" },
  "font-weight": { 600: "font-semibold", 500: "font-medium" },
  "white-space": { nowrap: "whitespace-nowrap" },
  "text-overflow": { ellipsis: "text-ellipsis" },
  overflow: { hidden: "overflow-hidden", auto: "overflow-auto" },
  "overflow-x": { auto: "overflow-x-auto" },
};
const prefixes = {
  width: "w",
  height: "h",
  "min-width": "min-w",
  "max-width": "max-w",
  "min-height": "min-h",
  "max-height": "max-h",
  "margin-top": "mt",
  "margin-bottom": "mb",
  "margin-left": "ml",
  "margin-right": "mr",
  "margin-inline": "mx",
  "padding-top": "pt",
  "padding-bottom": "pb",
  "padding-inline": "px",
  padding: "p",
  margin: "m",
  gap: "gap",
  "row-gap": "gap-y",
  "column-gap": "gap-x",
  "border-radius": "rounded",
  "font-size": "text",
  "line-height": "leading",
  "letter-spacing": "tracking",
  "font-weight": "font",
  "grid-template-columns": "grid-cols",
  "box-shadow": "shadow",
  "text-align": "text",
  "vertical-align": "align",
};
function utility({ prop, value }) {
  if (prop === "font" && value === "inherit") return "";
  if (values[prop]?.[value]) return values[prop][value];
  if (prop === "color") return `text-[color:${value.replaceAll(" ", "_")}]`;
  if (prop === "background")
    return `[background:${value.replaceAll(" ", "_")}]`;
  if (prop === "flex" && value === "1") return "flex-1";
  if (prop === "height" && value === "100%") return "h-full";
  if (prop === "width" && value === "100%") return "w-full";
  if (prop === "margin-inline" && value === "auto") return "mx-auto";
  if (prefixes[prop] && !value.includes(" "))
    return `${prefixes[prop]}-[${value}]`;
  return `[${prop}:${value.replaceAll(" ", "_")}]`;
}
let moved = 0;
for (const name of ["shell", "home", "docs"]) {
  const path = new URL(`apps/site/app/styles/${name}.css`, root);
  const css = postcss.parse(await readFile(path, "utf8"));
  for (const rule of [...css.nodes]) {
    if (rule.type !== "rule" || !/^\.[a-z][\w-]*$/.test(rule.selector))
      continue;
    const className = rule.selector.slice(1);
    if (
      !rule.nodes.every(
        (node) => node.type === "decl" && !node.prop.startsWith("--"),
      )
    )
      continue;
    const consumers = [...sources].filter(([, source]) =>
      new RegExp(`(?<![\\w-])${className}(?![\\w-])`).test(source),
    );
    const isShared = name === "shell" && shared.has(className);
    const permitted =
      name === "home"
        ? className !== "h-feats"
        : name === "shell"
          ? shell.has(className)
          : className !== "copy-demo-square";
    if (
      !isShared &&
      (!permitted ||
        !consumers.length ||
        consumers.some(([file]) => !owned.includes(file)))
    )
      continue;
    const utilities = rule.nodes.map(utility).filter(Boolean).join(" ");
    if (isShared) {
      rule.replaceWith(
        postcss.atRule({
          name: "utility",
          params: className,
          nodes: [postcss.atRule({ name: "apply", params: utilities })],
        }),
      );
    } else {
      for (const [file, source] of sources) {
        if (!owned.includes(file)) continue;
        sources.set(
          file,
          source.replace(
            /className=(\{?)(["`])([\s\S]*?)\2/g,
            (match, brace, quote, classes) => {
              const tokens = classes.split(/\s+/);
              if (!tokens.includes(className)) return match;
              return `className=${brace}${quote}${classes} ${utilities}${quote}`;
            },
          ),
        );
      }
      rule.remove();
    }
    moved += rule.nodes.length;
  }
  await writeFile(path, css.toString());
}
for (const file of owned)
  await writeFile(new URL(file, root), sources.get(file));
console.log(
  `Migrated ${moved} presentation declarations to Tailwind utilities.`,
);
