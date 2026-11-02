// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { explore, type World } from "../../../tests/model/explore.js";
import { createHoldToConfirm } from "./index.js";

const holdMs = 300;
const resetMs = 1000;

afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function world(): World {
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  document.body.replaceChildren();
  const button = document.createElement("button");
  button.textContent = "Delete";
  document.body.append(button);
  const start = Date.now();
  let confirmedAt: number | undefined;
  let pressedSinceConfirm = false;
  let confirmedWithoutPress = false;
  let emptiedEarly = false;
  const controller = createHoldToConfirm(button, {
    holdMs,
    resetMs,
    onConfirm: () => {
      if (!pressedSinceConfirm) confirmedWithoutPress = true;
      pressedSinceConfirm = false;
      confirmedAt = Date.now();
    },
  });
  const fill = button.querySelector<HTMLElement>(".re-hold-fill");
  const pointer = (target: EventTarget, type: string) => {
    const event = new MouseEvent(type, { bubbles: true, button: 0 });
    Object.assign(event, { pointerId: 1, isPrimary: true });
    target.dispatchEvent(event);
  };
  const key = (target: EventTarget, type: string, name: string) =>
    target.dispatchEvent(
      new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true }),
    );
  const watch = () => {
    const recent =
      confirmedAt !== undefined && Date.now() - confirmedAt < resetMs;
    if (recent && fill?.style.transform !== "scaleX(1)") emptiedEarly = true;
  };
  const step = (run: () => void) => () => {
    run();
    watch();
  };
  const press = (run: () => void) =>
    step(() => {
      pressedSinceConfirm = true;
      run();
    });
  return {
    steps: {
      "pointer down": press(() => pointer(button, "pointerdown")),
      "pointer up": step(() => pointer(window, "pointerup")),
      "pointer leaves": step(() => pointer(button, "pointerleave")),
      "Enter down": press(() => key(button, "keydown", "Enter")),
      "Enter up": step(() => key(window, "keyup", "Enter")),
      Escape: step(() => key(window, "keydown", "Escape")),
      "page disables it": step(() =>
        button.setAttribute("aria-disabled", "true"),
      ),
      "page enables it": step(() => button.removeAttribute("aria-disabled")),
      "time: next timer": step(() => vi.advanceTimersToNextTimer()),
      "time: 100ms": step(() => vi.advanceTimersByTime(100)),
    },
    checks: {
      "a hold confirms only after a press": () => !confirmedWithoutPress,
      "a confirmed hold keeps its fill until it resets": () => !emptiedEarly,
    },
    fingerprint: () =>
      [
        button.getAttribute("data-holding"),
        button.getAttribute("data-confirmed"),
        button.getAttribute("aria-disabled"),
        fill?.style.transform,
        pressedSinceConfirm,
        confirmedAt === undefined ? "" : Date.now() - confirmedAt,
        vi.getTimerCount(),
        Date.now() - start,
      ].join("|"),
    home: () =>
      !button.hasAttribute("data-holding") &&
      !button.hasAttribute("data-confirmed") &&
      fill?.style.transform !== "scaleX(1)",
    teardown: () => controller.destroy(),
  };
}

it("keeps its principles under every order of four events", async () => {
  const verdict = await explore(world, 4);
  expect(
    verdict.ok ? "holds" : `${verdict.broke}: ${verdict.path.join(" → ")}`,
  ).toBe("holds");
});
