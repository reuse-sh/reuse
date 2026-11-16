// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { explore, type World } from "../../../tests/model/explore.js";
import { createJustifiedGallery } from "./justified.js";
import { placeLanes } from "./lanes.js";
import { createMasonry } from "./masonry.js";

const observers: { targets: Set<Element>; callback: () => void }[] = [];

class FakeResizeObserver {
  targets = new Set<Element>();
  constructor(readonly callback: () => void) {
    observers.push(this);
  }
  observe(target: Element) {
    this.targets.add(target);
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const settle = () => new Promise((resolve) => setTimeout(resolve));

async function resized(target: Element) {
  for (const observer of observers) {
    if (observer.targets.has(target)) observer.callback();
  }
  await frame();
}

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.stubGlobal("CSS", { supports: () => false });
  vi.stubGlobal("requestAnimationFrame", (run: () => void) => setTimeout(run));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

/** Children as they were when the gallery was hidden; ones added since must stay untouched. */
function snapshot(container: Element) {
  return new Map(
    Array.from(container.children).map((child) => [child, child.outerHTML]),
  );
}

function untouched(container: Element, before: Map<Element, string>) {
  return (
    Array.from(container.children).every((child) =>
      before.has(child)
        ? before.get(child) === child.outerHTML
        : !child.hasAttribute("style"),
    ) && !container.outerHTML.includes("undefined")
  );
}

const verdictOf = (verdict: Awaited<ReturnType<typeof explore>>) =>
  verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`;

function justifiedWorld(): World {
  const container = document.createElement("div");
  container.style.columnGap = "8px";
  let visible = 1000;
  let hidden = false;
  Object.defineProperty(container, "clientWidth", {
    get: () => (hidden ? 0 : visible),
  });
  const add = (ratio: number) => {
    const image = document.createElement("img");
    image.setAttribute("width", String(ratio * 100));
    image.setAttribute("height", "100");
    container.append(image);
  };
  for (const ratio of [1.5, 0.67, 1, 1.78, 0.8, 2.4, 1.33, 0.56, 1.5, 1]) {
    add(ratio);
  }
  document.body.append(container);
  const initial = container.outerHTML;
  const gallery = createJustifiedGallery(container, { lastRow: "hide" });
  let destroyed = false;
  let hiddenAs: Map<Element, string> | undefined;
  let frozen: Map<Element, string> | undefined;
  let edited = false;
  const resize = async (next: number) => {
    visible = next;
    await resized(container);
  };
  return {
    steps: {
      "scrollbar appears": () => resize(visible - 15),
      "window widens": () => resize(visible + 400),
      hide: async () => {
        hiddenAs ??= snapshot(container);
        hidden = true;
        await resized(container);
      },
      show: async () => {
        hiddenAs = undefined;
        hidden = false;
        await resized(container);
      },
      "item added": async () => {
        edited = true;
        add(1.2);
        await settle();
      },
      "item removed": async () => {
        edited = true;
        container.firstElementChild?.remove();
        await settle();
      },
      refresh: () => gallery.refresh(),
      destroy: () => {
        gallery.destroy();
        destroyed = true;
        frozen = snapshot(container);
      },
    },
    checks: {
      "a hidden gallery writes nothing": () =>
        hiddenAs === undefined || destroyed || untouched(container, hiddenAs),
      "nothing is written after destroy": () =>
        frozen === undefined || untouched(container, frozen),
      "destroy restores the first markup": () =>
        frozen === undefined || edited || container.outerHTML === initial,
      "every shown full row adds up to the width": () => {
        if (destroyed || hidden) return true;
        let open = 0;
        for (const child of Array.from(container.children) as HTMLElement[]) {
          if (child.hasAttribute("data-re-justified-row")) continue;
          const share = Number(
            child.style.getPropertyValue("--re-justified-share"),
          );
          if (!(share > 0)) return false;
          open += share;
          if (Math.abs(open - 1) < 1e-9) open = 0;
        }
        return open === 0;
      },
    },
    fingerprint: () =>
      [visible, hidden, destroyed, container.outerHTML].join("|"),
    teardown: () => {
      gallery.destroy();
      container.remove();
    },
  };
}

function masonryWorld(): World {
  const container = document.createElement("div");
  container.style.gridTemplateColumns = "100px 100px 100px";
  container.style.rowGap = "10px";
  let hidden = false;
  Object.defineProperty(container, "clientWidth", {
    get: () => (hidden ? 0 : 300),
  });
  const sizes = new Map<Element, number>();
  const add = (height: number) => {
    const item = document.createElement("div");
    sizes.set(item, height);
    item.getBoundingClientRect = () =>
      ({ height: sizes.get(item) ?? 0 }) as DOMRect;
    container.append(item);
  };
  for (const height of [100, 50, 80, 40, 30, 70]) add(height);
  document.body.append(container);
  const initial = container.outerHTML;
  const masonry = createMasonry(container);
  let destroyed = false;
  let hiddenAs: Map<Element, string> | undefined;
  return {
    steps: {
      "first item grows": async () => {
        const first = container.firstElementChild as Element;
        sizes.set(first, (sizes.get(first) ?? 0) + 60);
        await resized(first);
      },
      "item added": async () => {
        add(55);
        await settle();
      },
      "item removed": async () => {
        container.children[1]?.remove();
        await settle();
      },
      hide: async () => {
        hiddenAs ??= snapshot(container);
        hidden = true;
        await resized(container);
      },
      show: async () => {
        hiddenAs = undefined;
        hidden = false;
        await resized(container);
      },
      destroy: () => {
        masonry.destroy();
        destroyed = true;
      },
    },
    checks: {
      "a hidden gallery writes nothing": () =>
        hiddenAs === undefined || destroyed || untouched(container, hiddenAs),
      "destroy puts the markup back": () =>
        !destroyed ||
        Array.from(container.children).every(
          (child) => !child.hasAttribute("style"),
        ),
      "destroy keeps the container as it was": () =>
        !destroyed ||
        container.outerHTML.split(">")[0] === initial.split(">")[0],
      "every item sits where the lanes put it": () => {
        if (destroyed || hidden) return true;
        const items = Array.from(container.children) as HTMLElement[];
        const { placements } = placeLanes(
          items.map((item) => ({ size: sizes.get(item) ?? 0, span: 1 })),
          3,
          10,
          16,
        );
        return items.every(
          (item, index) =>
            item.style.gridColumn ===
              `${placements[index].lane + 1} / span 1` &&
            item.style.marginTop === `${placements[index].offset}px`,
        );
      },
    },
    fingerprint: () => [hidden, destroyed, container.outerHTML].join("|"),
    teardown: () => {
      masonry.destroy();
      container.remove();
    },
  };
}

// Every order of four steps is a few thousand jsdom worlds: both together
// measured 11.1s locally, past vitest's 5s default.
const exhaustive = { timeout: 30_000 };

it(
  "keeps the justified gallery's rules under every order of four events",
  exhaustive,
  async () => {
    expect(verdictOf(await explore(justifiedWorld, 4))).toBe("holds");
  },
);

it(
  "keeps the masonry fallback's rules under every order of four events",
  exhaustive,
  async () => {
    expect(verdictOf(await explore(masonryWorld, 4))).toBe("holds");
  },
);
