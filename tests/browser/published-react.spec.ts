import { createRequire } from "node:module";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { getUsage } from "../../packages/catalog/dist/index.js";
import { mount } from "./harness";

const require = createRequire(import.meta.url);
const requireTest = createRequire(require.resolve("vitest/package.json"));
const { rolldown } = await import(requireTest.resolve("rolldown"));

test("published React tabs paint both backgrounds on one root and release them on unmount", async ({
  page,
}) => {
  const blocks =
    getUsage("moving-highlight", "examples/tabs", "react")?.flatMap(
      (section) => section.blocks,
    ) ?? [];
  const source = blocks.find(
    (block) => block.kind === "code" && block.language === "tsx",
  );
  if (source?.kind !== "code") throw new Error("Missing published React tabs");
  const input = resolve("apps/site/published-tabs.tsx");
  const bundle = await rolldown({
    input,
    platform: "browser",
    transform: {
      jsx: { runtime: "automatic" },
      define: { "process.env.NODE_ENV": '"production"' },
    },
    plugins: [
      {
        name: "published-usage",
        resolveId(id: string) {
          if (id === input) return input;
          if (id.endsWith(".css")) return "\0stylesheet";
        },
        load(id: string) {
          if (id === "\0stylesheet") return "export {};";
          if (id === input)
            return `${source.code}\nimport { createRoot } from "react-dom/client"; const app = createRoot(document.getElementById("app")); app.render(<ProjectTabs />); window.__unmount = () => app.unmount();`;
        },
      },
    ],
  });
  const result = await bundle.generate({
    format: "iife",
    name: "PublishedTabs",
  });
  await bundle.close();
  await mount(page, '<div id="app"></div>', ["interactions/styles.css"]);
  for (const block of blocks)
    if (block.kind === "code" && block.language === "css") {
      const css = block.code.replace(/@import[^;]*;/g, "").trim();
      if (css) await page.addStyleTag({ content: css });
    }
  await page.addStyleTag({
    content:
      '[role="tablist"] { display:flex; gap:8px; } [role="tab"] { padding:8px 12px; }',
  });
  const output = result.output.find(
    (output: { type: string }) => output.type === "chunk",
  );
  await page.addScriptTag({ content: output.code });
  await expect(page.locator(".re-tab-selected")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await page.getByRole("tab", { name: "Activity", exact: true }).click();
  await expect(page.locator("#panel-activity")).toBeVisible();
  await expect(page.locator(".re-tab-selected")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await page.getByRole("tab", { name: "Files", exact: true }).focus();
  await expect(page.locator(".re-tab-hover")).toHaveAttribute(
    "data-visible",
    "true",
  );
  await expect(page.locator("[data-re-highlight-root]")).toHaveCount(1);
  const root = await page.locator("[data-re-highlight-root]").elementHandle();
  if (!root) throw new Error("The highlight root is missing");
  await page.evaluate(() =>
    (window as unknown as { __unmount: () => void }).__unmount(),
  );
  expect(
    await root.evaluate((element) =>
      element.hasAttribute("data-re-highlight-root"),
    ),
  ).toBe(false);
  await expect(page.locator(".re-moving-highlight")).toHaveCount(0);
});

test("useLightbox applies changed options at the next open and a changed loop at once", async ({
  page,
}) => {
  const input = resolve("apps/site/lightbox-options.tsx");
  const bundle = await rolldown({
    input,
    platform: "browser",
    transform: {
      jsx: { runtime: "automatic" },
      define: { "process.env.NODE_ENV": '"production"' },
    },
    plugins: [
      {
        name: "lightbox-options",
        resolveId(id: string) {
          if (id === input) return input;
        },
        load(id: string) {
          if (id !== input) return;
          return `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
const items = [0, 1, 2].map((index) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 1200, height: 800, alt: "Photo " + index }));
function App() {
  const [label, setLabel] = useState("First");
  const [loop, setLoop] = useState(false);
  const lightbox = useLightbox({ label, loop, history: false, duration: 0 });
  window.__app = { lightbox, set: (next) => flushSync(() => { setLabel(next.label ?? label); setLoop(next.loop ?? loop); }) };
  return <button type="button" onClick={() => lightbox.open(items, 2)}>Open</button>;
}
createRoot(document.getElementById("app")).render(<App />);`;
        },
      },
    ],
  });
  const result = await bundle.generate({ format: "iife", name: "Options" });
  await bundle.close();
  await mount(page, '<div id="app"></div>', [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  const output = result.output.find(
    (output: { type: string }) => output.type === "chunk",
  );
  await page.addScriptTag({ content: output.code });
  type App = {
    __app: {
      lightbox: { next(): void; getState(): { index: number } };
      set(next: { label?: string; loop?: boolean }): void;
    };
  };
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveAttribute("aria-label", "First");
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog")).toHaveCount(0);
  await page.evaluate(() =>
    (window as unknown as App).__app.set({ label: "Second" }),
  );
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveAttribute("aria-label", "Second");
  await page.evaluate(() =>
    (window as unknown as App).__app.set({ loop: true }),
  );
  await page.evaluate(() => (window as unknown as App).__app.lightbox.next());
  expect(
    await page.evaluate(
      () => (window as unknown as App).__app.lightbox.getState().index,
    ),
  ).toBe(0);
});
