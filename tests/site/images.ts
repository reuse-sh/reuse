import { fileURLToPath } from "node:url";
import type { BrowserContext, Page } from "@playwright/test";

const publicDir = fileURLToPath(
  new URL("../../apps/site/public", import.meta.url),
);

/** Examples load their pictures from https://reuse.sh/images; answer those from this checkout. */
export function serveExampleImages(target: Page | BrowserContext) {
  return target.route("https://reuse.sh/images/**", (route) =>
    route.fulfill({
      path: `${publicDir}${new URL(route.request().url()).pathname}`,
    }),
  );
}
