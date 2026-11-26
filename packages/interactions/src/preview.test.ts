// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createCursorPreview } from "./index.js";

let reduced = false;
let hover = true;
const decodes: Array<{ src: string; resolve(): void; reject(): void }> = [];

function pointer(
  node: EventTarget,
  type: string,
  x = 100,
  y = 100,
  init: PointerEventInit = {},
) {
  node.dispatchEvent(
    new PointerEvent(type, {
      bubbles: type !== "pointerleave",
      clientX: x,
      clientY: y,
      pointerType: "mouse",
      pointerId: 1,
      isPrimary: true,
      ...init,
    }),
  );
}

function setup(options: Parameters<typeof createCursorPreview>[1] = {}) {
  const root = document.createElement("ul");
  root.innerHTML = `
    <li data-re-preview="/a.webp">A</li>
    <li class="gap">gap</li>
    <li data-re-preview="/b.webp">B</li>
    <li data-re-preview="/c.webp" aria-disabled="true">C</li>`;
  document.body.append(root);
  const [a, gap, b, c] = [...root.children] as HTMLElement[];
  const preview = createCursorPreview(root, options);
  const popup = document.body.querySelector<HTMLElement>(".re-cursor-preview");
  if (!popup) throw new Error("No popup.");
  const shownSrc = () =>
    popup.hidden
      ? null
      : (popup.querySelector("img")?.getAttribute("src") ?? null);
  return { root, a, gap, b, c, preview, popup, shownSrc };
}

async function flush() {
  for (let tick = 0; tick < 5; tick++) await Promise.resolve();
}

async function decodeAll() {
  for (const decode of decodes.splice(0)) decode.resolve();
  await flush();
}

beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  hover = true;
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    get matches() {
      return query.includes("reduced-motion") ? reduced : hover;
    },
    addEventListener() {},
    removeEventListener() {},
  }));
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value(this: HTMLImageElement) {
      return new Promise<void>((resolve, reject) =>
        decodes.push({ src: this.getAttribute("src") ?? "", resolve, reject }),
      );
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return this.classList.contains("re-cursor-preview-layer") ? 200 : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return this.classList.contains("re-cursor-preview-layer") ? 250 : 0;
    },
  });
});

afterEach(() => {
  document.body.replaceChildren();
  decodes.length = 0;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (HTMLImageElement.prototype as Partial<HTMLImageElement>).decode;
  delete (HTMLElement.prototype as Partial<HTMLElement>).offsetWidth;
  delete (HTMLElement.prototype as Partial<HTMLElement>).offsetHeight;
});

const position = (popup: HTMLElement) => {
  const match = popup.style.transform.match(
    /translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\) rotate\(([-\d.]+)deg\)/,
  );
  if (!match) throw new Error(`No transform: ${popup.style.transform}`);
  return { x: Number(match[1]), y: Number(match[2]), tilt: Number(match[3]) };
};

it("arrives below and right of the pointer after the delay, hidden from assistive technology", async () => {
  const { a, popup, shownSrc } = setup();
  pointer(a, "pointerover", 100, 120);
  vi.advanceTimersByTime(59);
  await decodeAll();
  expect(shownSrc()).toBeNull();
  vi.advanceTimersByTime(1);
  await decodeAll();
  expect(shownSrc()).toBe("/a.webp");
  expect(popup.getAttribute("aria-hidden")).toBe("true");
  expect(popup.dataset.state).toBe("open");
  expect(position(popup)).toEqual({ x: 124, y: 144, tilt: 0 });
});

it("follows the pointer and leans while it travels right, then settles upright", async () => {
  const { a, popup } = setup({ delay: 0 });
  pointer(a, "pointerover", 100, 100);
  await decodeAll();
  pointer(a, "pointermove", 400, 100);
  vi.advanceTimersByTime(48);
  const moving = position(popup);
  expect(moving.x).toBeGreaterThan(124);
  expect(moving.x).toBeLessThan(424);
  expect(moving.tilt).toBeGreaterThan(0);
  vi.advanceTimersByTime(1500);
  expect(position(popup)).toEqual({ x: 424, y: 124, tilt: 0 });
});

it("flips to the pointer's other side and keeps a margin from the window edge", async () => {
  const { a, popup } = setup({ delay: 0, tilt: 0 });
  pointer(a, "pointerover", window.innerWidth - 50, window.innerHeight - 50);
  await decodeAll();
  const { x, y } = position(popup);
  expect(x).toBe(window.innerWidth - 50 - 24 - 200);
  expect(y).toBe(window.innerHeight - 50 - 24 - 250);
});

it("centers on the pointer and stays inside the window, rotated corners included", async () => {
  const { a, popup } = setup({ delay: 0, placement: "center" });
  pointer(a, "pointerover", 10, 10);
  await decodeAll();
  const { x, y } = position(popup);
  expect(x).toBeGreaterThan(16);
  expect(y).toBeGreaterThan(16);
});

it("holds the picture over a gap and closes only after leaving the group", async () => {
  const { root, a, gap, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  await decodeAll();
  pointer(gap, "pointerover");
  vi.advanceTimersByTime(500);
  expect(shownSrc()).toBe("/a.webp");
  pointer(root, "pointerleave");
  vi.advanceTimersByTime(79);
  expect(shownSrc()).toBe("/a.webp");
  vi.advanceTimersByTime(1);
  expect(shownSrc()).toBeNull();
});

it("stays open when the pointer comes back before the close delay ends", async () => {
  const { root, a, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  await decodeAll();
  pointer(root, "pointerleave");
  vi.advanceTimersByTime(40);
  pointer(a, "pointerover");
  vi.advanceTimersByTime(200);
  expect(shownSrc()).toBe("/a.webp");
});

it("keeps the current picture until the next one has decoded", async () => {
  const { a, b, popup, shownSrc } = setup({ delay: 0 });
  const settle = (src: string) =>
    decodes.find((decode) => decode.src === src)?.resolve();
  pointer(a, "pointerover");
  settle("/a.webp");
  await flush();
  expect(shownSrc()).toBe("/a.webp");

  pointer(b, "pointerover");
  await flush();
  expect(shownSrc()).toBe("/a.webp");
  settle("/b.webp");
  await flush();
  expect(shownSrc()).toBe("/b.webp");
  expect(popup.querySelectorAll("img")).toHaveLength(1);
});

it("leaves the current picture in place when the next image fails to decode", async () => {
  const root = document.createElement("div");
  root.innerHTML =
    '<a data-re-preview="/ok.webp">ok</a><a data-re-preview="/broken.webp">broken</a>';
  document.body.append(root);
  const [ok, broken] = [...root.children] as HTMLElement[];
  createCursorPreview(root, { delay: 0 });
  pointer(ok, "pointerover");
  for (const decode of decodes.splice(0))
    if (decode.src === "/ok.webp") decode.resolve();
    else decode.reject();
  await decodeAll();
  pointer(broken, "pointerover");
  await decodeAll();
  expect(
    document.querySelector(".re-cursor-preview img")?.getAttribute("src"),
  ).toBe("/ok.webp");
});

it("starts loading every image in the group on the first pointer over it", () => {
  const { gap } = setup();
  pointer(gap, "pointerover");
  expect(decodes.map((decode) => decode.src).sort()).toEqual([
    "/a.webp",
    "/b.webp",
  ]);
});

it("never opens for touch, a second pointer, a disabled item, or a device without hover", async () => {
  const { a, b, c, shownSrc, preview } = setup({ delay: 0 });
  pointer(a, "pointerover", 100, 100, { pointerType: "touch" });
  pointer(c, "pointerover");
  await decodeAll();
  expect(shownSrc()).toBeNull();

  pointer(a, "pointerover");
  await decodeAll();
  pointer(b, "pointerover", 100, 100, { pointerId: 7 });
  await decodeAll();
  expect(shownSrc()).toBe("/a.webp");

  hover = false;
  preview.update({});
  expect(shownSrc()).toBeNull();
  pointer(b, "pointerover");
  await decodeAll();
  expect(shownSrc()).toBeNull();
});

it("sits at the pointer with no lean under reduced motion", async () => {
  reduced = true;
  const { a, popup } = setup({ delay: 0 });
  pointer(a, "pointerover", 100, 100);
  await decodeAll();
  pointer(a, "pointermove", 500, 300);
  expect(position(popup)).toEqual({ x: 524, y: 324, tilt: 0 });
});

it("closes when its item is removed and when Escape is pressed", async () => {
  const { a, b, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  await decodeAll();
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  expect(shownSrc()).toBeNull();

  pointer(b, "pointerover");
  await decodeAll();
  expect(shownSrc()).toBe("/b.webp");
  b.remove();
  await Promise.resolve();
  expect(shownSrc()).toBeNull();
});

it("re-reads the item under a still pointer when the page scrolls", async () => {
  const { root, a, b, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover", 50, 60);
  await decodeAll();
  document.elementFromPoint = () => b;
  window.dispatchEvent(new Event("scroll"));
  await decodeAll();
  expect(shownSrc()).toBe("/b.webp");
  document.elementFromPoint = () => document.body;
  window.dispatchEvent(new Event("scroll"));
  expect(shownSrc()).toBeNull();
  expect(root.isConnected).toBe(true);
});

it("leaves nothing behind when destroyed", async () => {
  const { a, preview, shownSrc } = setup({ delay: 30 });
  pointer(a, "pointerover");
  preview.destroy();
  vi.advanceTimersByTime(1000);
  await decodeAll();
  expect(shownSrc()).toBeNull();
  expect(document.querySelector(".re-cursor-preview")).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
  pointer(a, "pointerover");
  expect(document.querySelector(".re-cursor-preview")).toBeNull();
});

it("swaps a placeholder for the real content on refresh, and reuses a node it was given before", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<a data-row="a">A</a><a data-row="b">B</a>';
  document.body.append(root);
  const [a, b] = [...root.children] as HTMLElement[];
  const loading = document.createElement("i");
  let ready: Record<string, HTMLElement> | null = null;
  const preview = createCursorPreview(root, {
    selector: "[data-row]",
    delay: 0,
    content: (row) => ready?.[row.dataset.row ?? ""] ?? loading,
  });
  pointer(a, "pointerover");
  await flush();
  const popup = document.querySelector(".re-cursor-preview");
  expect(popup?.querySelector("i")).toBe(loading);

  pointer(b, "pointerover");
  await flush();
  expect(popup?.querySelectorAll("i")).toHaveLength(1);

  const scene = document.createElement("b");
  ready = { a: document.createElement("u"), b: scene };
  preview.refresh();
  await flush();
  expect(popup?.querySelector(".re-cursor-preview-layer > *")).toBe(scene);
});
