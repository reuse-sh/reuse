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

it("stays closed when the page scrolls or a decode lands after the pointer left", async () => {
  const { root, a, b, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  decodes.find((decode) => decode.src === "/a.webp")?.resolve();
  await flush();
  pointer(b, "pointerover");
  pointer(root, "pointerleave");
  document.elementFromPoint = () => a;
  window.dispatchEvent(new Event("scroll"));
  await decodeAll();
  vi.advanceTimersByTime(80);
  await flush();
  expect(shownSrc()).toBeNull();
  vi.advanceTimersByTime(1000);
  await flush();
  expect(shownSrc()).toBeNull();
});

it("keeps its spring and lean through refresh and update", async () => {
  const { a, popup, preview } = setup({ delay: 0 });
  pointer(a, "pointerover", 100, 100);
  await decodeAll();
  pointer(a, "pointermove", 500, 100);
  vi.advanceTimersByTime(32);
  const before = position(popup);
  preview.update({ tilt: 8 });
  preview.refresh();
  const after = position(popup);
  expect(after.x).toBeCloseTo(before.x, 0);
  expect(after.tilt).toBeCloseTo(before.tilt, 1);
  expect(after.x).toBeLessThan(524);
});

it("loads a lazy image in a template eagerly, and retries one that failed", async () => {
  const root = document.createElement("div");
  root.innerHTML =
    '<a data-re-preview-template="card">card</a><a data-re-preview="/retry.webp">retry</a>' +
    '<template id="card"><img loading="lazy" src="/lazy.webp" alt=""></template>';
  document.body.append(root);
  const [card, retry] = [...root.children] as HTMLElement[];
  createCursorPreview(root, { delay: 0 });
  pointer(card, "pointerover");
  const lazy = decodes.find((decode) => decode.src === "/lazy.webp");
  expect(lazy).toBeDefined();
  lazy?.resolve();
  await flush();
  const shown = document.querySelector<HTMLImageElement>(
    ".re-cursor-preview img",
  );
  expect(shown?.getAttribute("src")).toBe("/lazy.webp");
  expect(shown?.loading).toBe("eager");

  decodes.find((decode) => decode.src === "/retry.webp")?.reject();
  pointer(retry, "pointerover");
  await flush();
  pointer(card, "pointerover");
  await flush();
  decodes.length = 0;
  pointer(retry, "pointerover");
  expect(decodes.map((decode) => decode.src)).toEqual(["/retry.webp"]);
});

it("cancels a pending open when Escape is pressed", async () => {
  const { a, shownSrc } = setup();
  pointer(a, "pointerover");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  vi.advanceTimersByTime(100);
  await decodeAll();
  expect(shownSrc()).toBeNull();
});

it("keeps a margin from the top edge while a corner-hung card leans", async () => {
  const { a, popup } = setup({ delay: 0 });
  pointer(a, "pointerover", 900, 0);
  await decodeAll();
  let highest = Number.POSITIVE_INFINITY;
  for (let x = 860; x >= 100; x -= 60) {
    pointer(a, "pointermove", x, 0);
    vi.advanceTimersByTime(16);
    const { y, tilt } = position(popup);
    const rise = 200 * Math.sin((Math.abs(tilt) * Math.PI) / 180);
    highest = Math.min(highest, y - rise);
  }
  expect(highest).toBeGreaterThanOrEqual(15.5);
});

it("switches to the item the pointer comes back to after leaving mid-decode", async () => {
  const { root, a, b, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  decodes.find((decode) => decode.src === "/a.webp")?.resolve();
  await flush();
  pointer(b, "pointerover");
  pointer(root, "pointerleave");
  pointer(b, "pointerover");
  await decodeAll();
  expect(shownSrc()).toBe("/b.webp");
});

it("retries a failed picture when the pointer returns to it across a gap", async () => {
  const { a, gap, b, shownSrc } = setup({ delay: 0 });
  pointer(a, "pointerover");
  decodes.find((decode) => decode.src === "/a.webp")?.resolve();
  decodes.find((decode) => decode.src === "/b.webp")?.reject();
  await flush();
  pointer(b, "pointerover");
  await flush();
  expect(shownSrc()).toBe("/a.webp");
  decodes.length = 0;
  pointer(gap, "pointerover");
  pointer(b, "pointerover");
  expect(decodes.map((decode) => decode.src)).toEqual(["/b.webp"]);
  await decodeAll();
  expect(shownSrc()).toBe("/b.webp");
});

it("asks for custom content on every visit, and keeps a node it returns again in place", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<a data-row="a">A</a>';
  document.body.append(root);
  const [a] = [...root.children] as HTMLElement[];
  let price = "10";
  const stable = document.createElement("b");
  let fresh = true;
  const preview = createCursorPreview(root, {
    selector: "[data-row]",
    delay: 0,
    content: () => {
      if (!fresh) return stable;
      const node = document.createElement("span");
      node.textContent = price;
      return node;
    },
  });
  const popup = document.querySelector<HTMLElement>(".re-cursor-preview");
  pointer(a, "pointerover");
  await flush();
  expect(popup?.textContent).toBe("10");
  pointer(root, "pointerleave");
  vi.advanceTimersByTime(80);
  price = "20";
  pointer(a, "pointerover");
  await flush();
  expect(popup?.textContent).toBe("20");

  fresh = false;
  preview.refresh();
  await flush();
  const layer = popup?.querySelector(".re-cursor-preview-layer");
  preview.refresh();
  await flush();
  expect(popup?.querySelectorAll(".re-cursor-preview-layer")).toHaveLength(1);
  expect(popup?.querySelector(".re-cursor-preview-layer")).toBe(layer);
  expect(layer?.firstElementChild).toBe(stable);

  const lazy = document.createElement("img");
  lazy.loading = "lazy";
  lazy.src = "/changed.webp";
  stable.replaceChildren(lazy);
  preview.refresh();
  expect(decodes.map((decode) => decode.src)).toContain("/changed.webp");
  expect(lazy.loading).toBe("eager");
});

it("does not ask again for a failed picture while the pointer rests on it", async () => {
  const { a, b, shownSrc } = setup({ delay: 0 });
  b.innerHTML = "<span>Mint</span> <span>and ember</span>";
  pointer(a, "pointerover");
  decodes.find((decode) => decode.src === "/a.webp")?.resolve();
  decodes.find((decode) => decode.src === "/b.webp")?.reject();
  await flush();
  pointer(b, "pointerover");
  await flush();
  decodes.length = 0;
  document.elementFromPoint = () => b;
  for (let event = 0; event < 10; event++)
    window.dispatchEvent(new Event("scroll"));
  for (const child of b.children) pointer(child, "pointerover");
  await flush();
  expect(decodes).toHaveLength(0);
  expect(shownSrc()).toBe("/a.webp");
});

it("shows the hovered item when refreshed after its picture failed", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<a data-row="a">A</a><a data-row="b">B</a>';
  document.body.append(root);
  const [a, b] = [...root.children] as HTMLElement[];
  const sources: Record<string, string> = { a: "/a.webp", b: "/broken.webp" };
  const preview = createCursorPreview(root, {
    selector: "[data-row]",
    delay: 0,
    content: (row) => {
      const image = document.createElement("img");
      image.src = sources[row.dataset.row ?? ""];
      return image;
    },
  });
  const shown = () =>
    document.querySelector(".re-cursor-preview img")?.getAttribute("src");
  pointer(a, "pointerover");
  await decodeAll();
  pointer(b, "pointerover");
  decodes.splice(0)[0]?.reject();
  await flush();
  expect(shown()).toBe("/a.webp");
  sources.b = "/b.webp";
  preview.refresh();
  await decodeAll();
  expect(shown()).toBe("/b.webp");
});

it("keeps showing content from a fragment it is handed again", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<a data-row="a">A</a><a data-row="b">B</a>';
  document.body.append(root);
  const [a, b] = [...root.children] as HTMLElement[];
  const fragments = new Map<string, DocumentFragment>();
  for (const key of ["a", "b"]) {
    const fragment = document.createDocumentFragment();
    fragment.append(key.toUpperCase());
    fragments.set(key, fragment);
  }
  createCursorPreview(root, {
    selector: "[data-row]",
    delay: 0,
    content: (row) => fragments.get(row.dataset.row ?? "") ?? null,
  });
  const popup = document.querySelector(".re-cursor-preview");
  for (const row of [a, b, a]) {
    pointer(row, "pointerover");
    await flush();
  }
  expect(popup?.textContent).toBe("A");
});

it("starts building custom content during the open delay, once", async () => {
  const root = document.createElement("div");
  root.innerHTML = '<a data-row="a">A</a>';
  document.body.append(root);
  const [a] = [...root.children] as HTMLElement[];
  let calls = 0;
  createCursorPreview(root, {
    selector: "[data-row]",
    delay: 90,
    content: () => {
      calls++;
      const image = document.createElement("img");
      image.src = "/custom.webp";
      return image;
    },
  });
  pointer(a, "pointerover");
  expect(decodes.map((decode) => decode.src)).toEqual(["/custom.webp"]);
  vi.advanceTimersByTime(90);
  await decodeAll();
  expect(calls).toBe(1);
  expect(
    document.querySelector(".re-cursor-preview img")?.getAttribute("src"),
  ).toBe("/custom.webp");
});
