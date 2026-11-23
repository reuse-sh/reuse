// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { createFloatingTooltip } from "./tooltip.js";

it("keeps descriptions and popup ownership consistent across four events", async () => {
  const alphabet = [
    "enter A",
    "enter B",
    "leave A",
    "leave B",
    "hide A",
    "remove B",
    "time",
    "destroy",
  ];
  const depth = 4;
  for (let sequence = 0; sequence < alphabet.length ** depth; sequence++) {
    const path = Array.from(
      { length: depth },
      (_, index) =>
        alphabet[
          Math.floor(sequence / alphabet.length ** index) % alphabet.length
        ],
    );
    const root = document.createElement("div");
    root.innerHTML =
      '<button data-re-tooltip="A" aria-describedby="other">A</button><button data-re-tooltip="B">B</button>';
    document.body.append(root);
    const [first, second] = root.querySelectorAll("button");
    vi.useFakeTimers();
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener() {},
      removeEventListener() {},
    }));
    const tooltip = createFloatingTooltip(root, { delay: 30, closeDelay: 40 });
    const popup = document.querySelector<HTMLElement>('[role="tooltip"]');
    if (!popup) throw new Error("Popup was never installed");
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
              {
                bubbles: true,
                pointerId: 1,
                pointerType: "mouse",
              },
            ),
          );
        }
        await Promise.resolve();
        const claimed = [first, second].filter((el) =>
          el.getAttribute("aria-describedby")?.split(" ").includes(popup.id),
        );
        const status = path.join(" → ");
        expect(claimed, status).toHaveLength(
          popup.isConnected && !popup.hidden ? 1 : 0,
        );
        if (claimed[0]) {
          expect(root.contains(claimed[0]) && !claimed[0].hidden, status).toBe(
            true,
          );
          expect(popup.textContent, status).toBe(claimed[0].dataset.reTooltip);
        }
        expect(
          first.getAttribute("aria-describedby")?.split(" ")[0],
          status,
        ).toBe("other");
      }
    } finally {
      tooltip.destroy();
      const pending = vi.getTimerCount();
      root.remove();
      vi.useRealTimers();
      vi.unstubAllGlobals();
      expect(pending).toBe(0);
    }
  }
});
