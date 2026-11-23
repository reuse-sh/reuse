// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createFloatingTooltip } from "./tooltip.js";

const actions = [
  "enter A",
  "enter B",
  "leave A",
  "leave B",
  "hide A",
  "remove B",
  "time",
  "destroy",
] as const;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it.each(actions)(
  "keeps tooltip ownership consistent across four events starting with %s",
  async (firstAction) => {
    const fixture = document.createElement("div");
    fixture.innerHTML =
      '<button data-re-tooltip="A" aria-describedby="other">A</button><button data-re-tooltip="B">B</button>';
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
      const root = fixture.cloneNode(true) as HTMLDivElement;
      document.body.append(root);
      const buttons = Array.from(root.querySelectorAll("button"));
      const [first, second] = buttons;
      const tooltip = createFloatingTooltip(root, {
        delay: 30,
        closeDelay: 40,
      });
      const popup = document.body.lastElementChild;
      if (
        !(popup instanceof HTMLElement) ||
        popup.getAttribute("role") !== "tooltip"
      ) {
        throw new Error("Popup was never installed");
      }

      try {
        for (const action of path) {
          if (action === "hide A") first.hidden = true;
          else if (action === "remove B") second.remove();
          else if (action === "time") vi.advanceTimersByTime(50);
          else if (action === "destroy") tooltip.destroy();
          else {
            const trigger = action.endsWith("A") ? first : second;
            trigger.dispatchEvent(
              new PointerEvent(
                action.startsWith("enter") ? "pointerover" : "pointerout",
                { bubbles: true, pointerId: 1, pointerType: "mouse" },
              ),
            );
          }
          await Promise.resolve();
          const claimed = buttons.filter((element) =>
            element
              .getAttribute("aria-describedby")
              ?.split(" ")
              .includes(popup.id),
          );
          expect(claimed, status).toHaveLength(
            popup.isConnected && !popup.hidden ? 1 : 0,
          );
          if (claimed[0]) {
            expect(
              root.contains(claimed[0]) && !claimed[0].hidden,
              status,
            ).toBe(true);
            expect(popup.textContent, status).toBe(
              claimed[0].dataset.reTooltip,
            );
          }
          expect(
            first.getAttribute("aria-describedby")?.split(" ")[0],
            status,
          ).toBe("other");
        }
      } finally {
        tooltip.destroy();
        root.remove();
        expect(vi.getTimerCount(), status).toBe(0);
      }
    }
  },
);
