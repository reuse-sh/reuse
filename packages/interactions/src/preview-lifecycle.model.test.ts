// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createCursorPreview } from "./preview.js";

const actions = [
  "over A",
  "over B",
  "over gap",
  "leave",
  "hide A",
  "remove B",
  "decode",
  "time",
  "escape",
  "destroy",
] as const;

const decodes: Array<() => void> = [];

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", (query: string) => ({
    media: query,
    matches: !query.includes("reduced-motion"),
    addEventListener() {},
    removeEventListener() {},
  }));
  Object.defineProperty(HTMLImageElement.prototype, "decode", {
    configurable: true,
    value() {
      return new Promise<void>((resolve) => decodes.push(resolve));
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (HTMLImageElement.prototype as Partial<HTMLImageElement>).decode;
});

const flush = async () => {
  for (let tick = 0; tick < 5; tick++) await Promise.resolve();
};

it.each(actions)(
  "shows at most one live picture, for an item still in the group, across four events starting with %s",
  async (firstAction) => {
    const suffixLength = 3;
    for (
      let sequence = 0;
      sequence < actions.length ** suffixLength;
      sequence++
    ) {
      const suffix = Array.from(
        { length: suffixLength },
        (_, index) =>
          actions[
            Math.floor(sequence / actions.length ** index) % actions.length
          ],
      );
      const path = [firstAction, ...suffix];
      const status = path.join(" → ");
      const root = document.createElement("div");
      root.innerHTML =
        '<a data-re-preview="/a.webp">A</a><span>gap</span><a data-re-preview="/b.webp">B</a>';
      document.body.append(root);
      const [first, gap, second] = [...root.children] as HTMLElement[];
      const preview = createCursorPreview(root, {
        delay: 30,
        closeDelay: 40,
      });
      let destroyed = false;
      let left = false;
      let waited = false;
      try {
        for (const action of path) {
          if (action === "hide A") first.hidden = true;
          else if (action === "remove B") second.remove();
          else if (action === "decode")
            for (const resolve of decodes.splice(0)) resolve();
          else if (action === "time") {
            vi.advanceTimersByTime(50);
            waited = left;
          } else if (action === "escape")
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "Escape" }),
            );
          else if (action === "destroy") {
            preview.destroy();
            destroyed = true;
          } else {
            const target =
              action === "leave"
                ? root
                : action === "over A"
                  ? first
                  : action === "over B"
                    ? second
                    : gap;
            left = action === "leave";
            waited = false;
            target.dispatchEvent(
              new PointerEvent(
                action === "leave" ? "pointerleave" : "pointerover",
                {
                  bubbles: action !== "leave",
                  pointerId: 1,
                  pointerType: "mouse",
                  isPrimary: true,
                },
              ),
            );
          }
          await flush();

          const popups =
            document.querySelectorAll<HTMLElement>(".re-cursor-preview");
          expect(popups.length, status).toBe(destroyed ? 0 : 1);
          const popup = popups[0];
          if (!popup || popup.hidden) continue;
          const pictures = popup.querySelectorAll("img");
          expect(pictures, status).toHaveLength(1);
          const owner =
            pictures[0].getAttribute("src") === "/a.webp" ? first : second;
          expect(owner.isConnected && !owner.hidden, status).toBe(true);
          expect(left && waited, status).toBe(false);
        }
      } finally {
        preview.destroy();
        root.remove();
        decodes.length = 0;
        expect(vi.getTimerCount(), status).toBe(0);
      }
    }
  },
);
