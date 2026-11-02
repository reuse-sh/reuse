import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import type { Page } from "@playwright/test";

const root = join(import.meta.dirname, "../..");
const types: Record<string, string> = {
  ".js": "text/javascript",
  ".css": "text/css",
};

// Serves the built packages at /modules/<package>/<file>, the way a plain page would load them.
export async function mount(
  page: Page,
  body: string,
  styles: string[] = [],
  origin = "http://reuse.test",
) {
  await page.route(`${origin}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === "/") {
      await route.fulfill({
        contentType: "text/html",
        body: `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{
  "@reuse-sh/carousel":"/modules/carousel/index.js",
  "@reuse-sh/annotations":"/modules/annotations/index.js",
  "@reuse-sh/avatars":"/modules/avatars/index.js",
  "@reuse-sh/interactions":"/modules/interactions/index.js",
  "@reuse-sh/loaders":"/modules/loaders/index.js",
  "@reuse-sh/gradients":"/modules/gradients/index.js",
  "@reuse-sh/lightbox":"/modules/lightbox/index.js",
  "@reuse-sh/core/escape-html":"/modules/core/escape-html.js"
}}</script>
${styles.map((href) => `<link rel="stylesheet" href="/modules/${href}">`).join("")}
<style>body{margin:0}</style></head><body>${body}</body></html>`,
      });
      return;
    }
    const match = /^\/modules\/([a-z-]+)\/(.+)$/.exec(pathname);
    if (!match) return route.fulfill({ status: 404 });
    const file = normalize(join(root, "packages", match[1], "dist", match[2]));
    if (!file.startsWith(join(root, "packages")))
      return route.fulfill({ status: 404 });
    await route.fulfill({
      contentType: types[extname(file)] ?? "application/octet-stream",
      body: await readFile(file),
    });
  });
  await page.goto(`${origin}/`);
}

// Samples a numeric expression on every animation frame until it stays unchanged for `idle` ms.
export async function framesUntilIdle(
  page: Page,
  expression: string,
  idle = 300,
): Promise<number[]> {
  return page.evaluate(
    ([source, quiet]) =>
      new Promise<number[]>((resolve) => {
        const read = new Function(`return (${source})`) as () => number;
        const values: number[] = [];
        let changed = performance.now();
        const tick = () => {
          const value = read();
          if (values.at(-1) !== value) {
            values.push(value);
            changed = performance.now();
          }
          if (performance.now() - changed > quiet) resolve(values);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    [expression, idle] as const,
  );
}

export function photo(index: number) {
  const hue = (index * 47) % 360;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="hsl(${hue} 60% 55%)"/></svg>`,
  )}`;
}
