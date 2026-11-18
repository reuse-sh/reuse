import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
  const lightbox = useLightbox({ strings: { dialog: label }, loop, history: false });
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

// One app for the client and the server: an owner that holds the lightbox, a trigger, a
// counter on the index, one on the count and an object selector.
const lightboxApp = `import { useLightbox, useLightboxState } from "@reuse-sh/lightbox/react";
import { useLayoutEffect } from "react";
export const items = [0, 1, 2, 3, 4, 5].map((index) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 1200, height: 800, alt: "Photo " + index }));
const counts = { renders: {}, commits: {}, handles: {} };
globalThis.__counts = counts;
function useCount(name, handle) {
  counts.renders[name] = (counts.renders[name] ?? 0) + 1;
  (counts.handles[name] ??= new Set()).add(handle);
  useLayoutEffect(() => { counts.commits[name] = (counts.commits[name] ?? 0) + 1; });
}
function Trigger({ lightbox }) {
  useCount("trigger", lightbox);
  return <button type="button" onClick={() => lightbox.open(items, 0)}>Open</button>;
}
function Index({ lightbox }) {
  const index = useLightboxState(lightbox, (state) => state.index);
  useCount("index", lightbox);
  return <output data-index="">{index + 1}</output>;
}
function Count({ lightbox }) {
  useLightboxState(lightbox, (state) => state.count);
  useCount("count", lightbox);
  return null;
}
function Summary({ lightbox }) {
  const summary = useLightboxState(lightbox, (state) => ({ index: state.index, open: state.isOpen }));
  return <output data-summary="">{summary.open ? "open" : "closed"} at {summary.index + 1}</output>;
}
export function App() {
  const lightbox = useLightbox({ history: false });
  useCount("owner", lightbox);
  if (typeof window !== "undefined") window.__lightbox = lightbox;
  return <><Trigger lightbox={lightbox} /><Index lightbox={lightbox} /><Count lightbox={lightbox} /><Summary lightbox={lightbox} /></>;
}`;

async function bundleApp(
  entry: string,
  platform: "browser" | "node",
  source = lightboxApp,
) {
  const input = resolve(`apps/site/lightbox-app-${platform}.tsx`);
  const app = resolve("apps/site/lightbox-app.tsx");
  const bundle = await rolldown({
    input,
    platform,
    transform: {
      jsx: { runtime: "automatic" },
      define: { "process.env.NODE_ENV": '"development"' },
    },
    plugins: [
      {
        name: "lightbox-app",
        resolveId(id: string) {
          if (id === input) return input;
          if (id === "./lightbox-app.tsx") return app;
        },
        load(id: string) {
          if (id === input) return entry;
          if (id === app) return source;
        },
      },
    ],
  });
  const result = await bundle.generate({ format: "esm" });
  await bundle.close();
  const chunk = result.output.find(
    (output: { type: string }) => output.type === "chunk",
  );
  return chunk.code as string;
}

async function serverHtml(source = lightboxApp) {
  const code = await bundleApp(
    `import { renderToString } from "react-dom/server";
import { App } from "./lightbox-app.tsx";
export const html = renderToString(<App />);`,
    "node",
    source,
  );
  const file = test.info().outputPath("server.mjs");
  await writeFile(file, code);
  const { html } = await import(pathToFileURL(file).href);
  return html as string;
}

test("useLightboxState renders on the server and hydrates without a mismatch", async ({
  page,
}) => {
  const html = await serverHtml();
  expect(html.replaceAll("<!-- -->", "")).toContain(
    '<output data-summary="">closed at 1</output>',
  );
  const client = await bundleApp(
    `import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./lightbox-app.tsx";
window.__errors = [];
hydrateRoot(document.getElementById("app"), <StrictMode><App /></StrictMode>, {
  onRecoverableError: (error) => window.__errors.push(String(error)),
});`,
    "browser",
  );
  await mount(page, `<div id="app">${html}</div>`, [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addScriptTag({ type: "module", content: client });
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("[data-summary]")).toHaveText("open at 1");
  expect(
    await page.evaluate(
      () => (window as unknown as { __errors: string[] }).__errors,
    ),
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test("useLightbox holds no state: paging re-renders only the selectors that change, under StrictMode", async ({
  page,
}) => {
  const client = await bundleApp(
    `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./lightbox-app.tsx";
createRoot(document.getElementById("app")).render(<StrictMode><App /></StrictMode>);`,
    "browser",
  );
  await mount(page, '<div id="app"></div>', [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.addScriptTag({ type: "module", content: client });
  await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
  type Counts = {
    renders: Record<string, number>;
    commits: Record<string, number>;
    handles: Record<string, Set<unknown>>;
  };
  type App = {
    __counts: Counts;
    __lightbox: { next(): void; getState(): { index: number } };
  };
  const read = () =>
    page.evaluate(() => {
      const { renders, commits, handles } = (window as unknown as App).__counts;
      return {
        renders: { ...renders },
        commits: { ...commits },
        handles: Object.fromEntries(
          Object.entries(handles).map(([name, set]) => [name, set.size]),
        ),
      };
    });
  const before = await read();
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  for (let index = 1; index <= 5; index += 1) {
    await page.evaluate(() => (window as unknown as App).__lightbox.next());
    await expect(page.locator("[data-index]")).toHaveText(String(index + 1));
  }
  await expect(page.locator("[data-summary]")).toHaveText("open at 6");
  const after = await read();
  expect(after.renders.owner - before.renders.owner).toBe(0);
  expect(after.renders.trigger - before.renders.trigger).toBe(0);
  expect(after.commits.count - before.commits.count).toBe(1);
  expect(after.commits.index - before.commits.index).toBe(5);
  expect(after.handles).toEqual(before.handles);
  expect(errors).toEqual([]);
});

// A boundary whose code arrives after the lightbox opened hydrates against the server's HTML.
const lateApp = `import { useLightbox, useLightboxState } from "@reuse-sh/lightbox/react";
import { Suspense } from "react";
const items = [{ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 1200, height: 800, alt: "Photo" }];
export function Summary({ lightbox }) {
  const open = useLightboxState(lightbox, (state) => state.isOpen);
  return <output data-late="">{open ? "open" : "closed"}</output>;
}
export function App({ Late = Summary }) {
  const lightbox = useLightbox({ history: false });
  return <><button type="button" onClick={() => lightbox.open(items, 0)}>Open</button><Suspense fallback={null}><Late lightbox={lightbox} /></Suspense></>;
}`;

test("useLightboxState hydrates a late Suspense boundary with the server's state after open()", async ({
  page,
}) => {
  const html = await serverHtml(lateApp);
  expect(html).toContain('<output data-late="">closed</output>');
  const client = await bundleApp(
    `import { lazy } from "react";
import { hydrateRoot } from "react-dom/client";
import { App, Summary } from "./lightbox-app.tsx";
window.__errors = [];
const Late = lazy(() => new Promise((resolve) => { window.__release = () => resolve({ default: Summary }); }));
hydrateRoot(document.getElementById("app"), <App Late={Late} />, {
  onRecoverableError: (error) => window.__errors.push(String(error)),
});`,
    "browser",
    lateApp,
  );
  await mount(page, `<div id="app">${html}</div>`, [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  await page.addScriptTag({ type: "module", content: client });
  await page.waitForFunction(() => "__release" in window);
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveCount(1);
  await page.evaluate(() =>
    (window as unknown as { __release: () => void }).__release(),
  );
  await expect(page.locator("[data-late]")).toHaveText("open");
  expect(
    await page.evaluate(
      () => (window as unknown as { __errors: string[] }).__errors,
    ),
  ).toEqual([]);
});

// Counts the listeners on the window, the document and its root elements and the timers and
// frames that are still pending, so a test can compare them before open and after unmount.
const tracker = `(() => {
  const live = new Set();
  const timers = new Set();
  const frames = new Set();
  const watched = (target) => target === window || target === document || target === document.documentElement || target === document.body;
  const capture = (options) => typeof options === "boolean" ? options : Boolean(options?.capture);
  const add = EventTarget.prototype.addEventListener;
  const remove = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (watched(this) && listener) {
      const entry = { target: this, type, listener, capture: capture(options), signal: options?.signal };
      live.add(entry);
      if (options?.once) {
        const drop = () => live.delete(entry);
        add.call(this, type, drop, { once: true, capture: entry.capture });
      }
    }
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    for (const entry of live)
      if (entry.target === this && entry.type === type && entry.listener === listener && entry.capture === capture(options)) live.delete(entry);
    return remove.call(this, type, listener, options);
  };
  const setTimer = window.setTimeout;
  const clearTimer = window.clearTimeout;
  window.setTimeout = (callback, delay, ...rest) => {
    const id = setTimer(() => { timers.delete(id); if (typeof callback === "function") callback(...rest); }, delay);
    timers.add(id);
    return id;
  };
  window.clearTimeout = (id) => { timers.delete(id); clearTimer(id); };
  const request = window.requestAnimationFrame;
  const cancel = window.cancelAnimationFrame;
  window.requestAnimationFrame = (callback) => {
    const id = request((time) => { frames.delete(id); callback(time); });
    frames.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => { frames.delete(id); cancel(id); };
  window.__leftovers = () => ({
    dialogs: document.querySelectorAll("dialog").length,
    overflow: document.body.style.overflow,
    listeners: [...live].filter((entry) => !entry.signal?.aborted).map((entry) => entry.type).sort(),
    timers: timers.size,
    frames: frames.size,
  });
})();`;

test("useLightbox keeps one lightbox through StrictMode and a real unmount leaves no dialog, scroll lock, listener or timer", async ({
  page,
}) => {
  const client = await bundleApp(
    `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./lightbox-app.tsx";
const root = createRoot(document.getElementById("app"));
root.render(<StrictMode><App /></StrictMode>);
window.__unmount = () => root.unmount();`,
    "browser",
  );
  await mount(page, '<div id="app"></div>', [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  await page.addScriptTag({ content: tracker });
  await page.addScriptTag({ type: "module", content: client });
  type Leftovers = {
    dialogs: number;
    overflow: string;
    listeners: string[];
    timers: number;
    frames: number;
  };
  type App = {
    __counts: { handles: Record<string, Set<unknown>> };
    __lightbox: unknown;
    __unmount: () => void;
    __leftovers: () => Leftovers;
  };
  await expect(page.getByRole("button", { name: "Open" })).toBeVisible();
  const before = await page.evaluate(() =>
    (window as unknown as App).__leftovers(),
  );
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  expect(
    await page.evaluate(() => {
      const { __counts, __lightbox } = window as unknown as App;
      return [...__counts.handles.owner].map((handle) => handle === __lightbox);
    }),
  ).toEqual([true]);
  const after = await page.evaluate(() => {
    const app = window as unknown as App;
    app.__unmount();
    return app.__leftovers();
  });
  expect(after).toEqual({ ...before, dialogs: 0 });
});

const activityApp = `import { Activity, useEffect, useState } from "react";
import { useLightbox } from "@reuse-sh/lightbox/react";
const items = [0, 1, 2].map((index) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 1200, height: 800, alt: "Photo " + index }));
window.__handles = new Set();
function Viewer() {
  const lightbox = useLightbox({ history: false });
  window.__handles.add(lightbox);
  useEffect(() => lightbox.open(items, 1), [lightbox]);
  return null;
}
export function App() {
  const [mode, setMode] = useState("visible");
  window.__setMode = setMode;
  return <Activity mode={mode}><Viewer /></Activity>;
}`;

test("useLightbox frees its viewer while Activity hides it and opens the same lightbox again on reveal", async ({
  page,
}) => {
  const client = await bundleApp(
    `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "./lightbox-app.tsx";
window.__errors = [];
const report = (error) => window.__errors.push(String(error));
createRoot(document.getElementById("app"), { onUncaughtError: report, onCaughtError: report }).render(<StrictMode><App /></StrictMode>);
window.__show = (mode) => flushSync(() => window.__setMode(mode));`,
    "browser",
    activityApp,
  );
  await mount(page, '<div id="app"></div>', [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addScriptTag({ type: "module", content: client });
  type App = {
    __errors: string[];
    __handles: Set<{ getState(): { isOpen: boolean; index: number } }>;
    __show: (mode: string) => void;
  };
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  expect(
    await page.evaluate(() => {
      (window as unknown as App).__show("hidden");
      return document.querySelectorAll("dialog").length;
    }),
  ).toBe(0);
  // Two tasks pass, longer than any cleanup deferred to the next task.
  await page.evaluate(
    () => new Promise((resolve) => setTimeout(() => setTimeout(resolve))),
  );
  await page.evaluate(() => (window as unknown as App).__show("visible"));
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  expect(
    await page.evaluate(() => {
      const app = window as unknown as App;
      return {
        errors: app.__errors,
        handles: app.__handles.size,
        state: [...app.__handles].map((lightbox) => {
          const { isOpen, index } = lightbox.getState();
          return { isOpen, index };
        }),
      };
    }),
  ).toEqual({
    errors: [],
    handles: 1,
    state: [{ isOpen: true, index: 1 }],
  });
  expect(errors).toEqual([]);
});

test("useLightbox passes an equal inline strings object on without relabelling", async ({
  page,
}) => {
  const input = resolve("apps/site/lightbox-equal-options.tsx");
  const bundle = await rolldown({
    input,
    platform: "browser",
    transform: {
      jsx: { runtime: "automatic" },
      define: { "process.env.NODE_ENV": '"production"' },
    },
    plugins: [
      {
        name: "lightbox-equal-options",
        resolveId(id: string) {
          if (id === input) return input;
        },
        load(id: string) {
          if (id !== input) return;
          return `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
const items = [0, 1].map((index) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", width: 1200, height: 800, alt: "Photo " + index }));
function App() {
  const [renders, setRenders] = useState(0);
  const lightbox = useLightbox({ history: false, autoHide: false, controls: { download: false }, strings: { close: "Shut" } });
  window.__app = { rerender: () => flushSync(() => setRenders(renders + 1)) };
  return <button type="button" data-renders={renders} onClick={() => lightbox.open(items, 0)}>Open</button>;
}
createRoot(document.getElementById("app")).render(<App />);`;
        },
      },
    ],
  });
  const result = await bundle.generate({ format: "iife", name: "Equal" });
  await bundle.close();
  await mount(page, '<div id="app"></div>', [
    "lightbox/base.css",
    "lightbox/theme.css",
  ]);
  const output = result.output.find(
    (output: { type: string }) => output.type === "chunk",
  );
  await page.addScriptTag({ content: output.code });
  await page.getByRole("button", { name: "Open" }).click();
  await expect(page.locator("dialog")).toHaveAttribute("data-phase", "open");
  const relabelled = await page.evaluate(async () => {
    const records: string[] = [];
    const observer = new MutationObserver((list) => {
      for (const record of list) records.push(record.attributeName ?? "");
    });
    observer.observe(document.querySelector("dialog") as HTMLElement, {
      attributes: true,
      attributeFilter: ["aria-label"],
      subtree: true,
    });
    (window as unknown as { __app: { rerender(): void } }).__app.rerender();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    observer.disconnect();
    return records.length;
  });
  await expect(page.getByRole("button", { name: "Open" })).toHaveAttribute(
    "data-renders",
    "1",
  );
  expect(relabelled).toBe(0);
});
