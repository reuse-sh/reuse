// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createFloatingTooltip,
  createHoldToConfirm,
  createMovingHighlight,
  type MovingHighlightOptions,
} from "./index.js";

let reduced = false;
const controllers: Array<{ destroy(): void }> = [];
function pointer(node: EventTarget, type: string, x = 20, y = 30) {
  node.dispatchEvent(
    new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y }),
  );
}
function rect(
  node: Element,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  Object.defineProperty(node, "getBoundingClientRect", {
    value: () => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON() {},
    }),
    configurable: true,
  });
}
beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reduced;
    },
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.destroy();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("hold to confirm", () => {
  function setup() {
    const button = document.createElement("button");
    button.textContent = "Delete";
    document.body.append(button);
    let count = 0;
    const controller = createHoldToConfirm(button, {
      holdMs: 100,
      onConfirm: () => {
        count++;
      },
    });
    controllers.push(controller);
    return { button, controller, count: () => count };
  }
  it("commits one action during a sustained press and permits a new press after release", () => {
    const { button, count } = setup();
    pointer(button, "pointerdown");
    vi.advanceTimersByTime(99);
    expect(count()).toBe(0);
    expect(button.hasAttribute("data-holding")).toBe(true);
    vi.advanceTimersByTime(1000);
    pointer(button, "pointerdown");
    vi.advanceTimersByTime(200);
    expect(count()).toBe(1);
    pointer(window, "pointerup");
    pointer(button, "pointerdown");
    vi.advanceTimersByTime(100);
    expect(count()).toBe(2);
  });
  it.each(["pointerup", "pointercancel", "blur", "Escape", "destroy"])(
    "cancels pending work on %s",
    (reason) => {
      const { button, count, controller } = setup();
      pointer(button, "pointerdown");
      vi.advanceTimersByTime(40);
      if (reason === "destroy") controller.destroy();
      else if (reason === "Escape")
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      else window.dispatchEvent(new Event(reason));
      vi.advanceTimersByTime(200);
      expect(count()).toBe(0);
      expect(button.hasAttribute("data-holding")).toBe(false);
    },
  );
  it("cancels when the holding pointer leaves the button, but not for another pointer", () => {
    const { button, count } = setup();
    const withId = (type: string, pointerId: number) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0 });
      Object.defineProperty(event, "pointerId", { value: pointerId });
      button.dispatchEvent(event);
    };
    withId("pointerdown", 1);
    vi.advanceTimersByTime(40);
    withId("pointerleave", 2);
    expect(button.hasAttribute("data-holding")).toBe(true);
    withId("pointerleave", 1);
    vi.advanceTimersByTime(200);
    expect(count()).toBe(0);
    expect(button.hasAttribute("data-holding")).toBe(false);
  });
  it("prevents keyboard auto-repeat, cancels key release, and allows assistive activation", () => {
    const { button, count } = setup();
    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", repeat: true }),
    );
    vi.advanceTimersByTime(100);
    expect(count()).toBe(1);
    button.dispatchEvent(new MouseEvent("click", { detail: 0 }));
    expect(count()).toBe(1);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter" }));
    button.dispatchEvent(new MouseEvent("click", { detail: 1 }));
    expect(count()).toBe(1);
    button.dispatchEvent(new MouseEvent("click", { detail: 0 }));
    expect(count()).toBe(2);
    button.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    vi.advanceTimersByTime(20);
    window.dispatchEvent(new KeyboardEvent("keyup", { key: " " }));
    vi.advanceTimersByTime(100);
    expect(count()).toBe(2);
  });
  it("cancels when disabled and restores the original markup on teardown", async () => {
    const { button, count, controller } = setup();
    pointer(button, "pointerdown");
    button.disabled = true;
    await Promise.resolve();
    vi.advanceTimersByTime(200);
    expect(count()).toBe(0);
    controller.destroy();
    expect(button.innerHTML).toBe("Delete");
    expect(button.hasAttribute("style")).toBe(false);
    expect(button.classList.contains("reuse-hold")).toBe(false);
  });
});

describe("floating tooltip", () => {
  function setup() {
    document.body.innerHTML =
      '<div><button data-reuse-tooltip="First" aria-describedby="original">One</button><button data-reuse-tooltip="Second">Two</button></div>';
    const root = document.body.firstElementChild as HTMLElement;
    const [first, second] = Array.from(root.querySelectorAll("button"));
    rect(first, 100, 100, 80, 32);
    rect(second, 240, 100, 80, 32);
    const controller = createFloatingTooltip(root, {
      delay: 40,
      side: "top",
      sideOffset: 12,
    });
    controllers.push(controller);
    const popup = document.querySelector('[role="tooltip"]') as HTMLElement;
    popup.style.width = "100px";
    popup.style.height = "20px";
    return { root, first, second, popup, controller };
  }
  it("shares content across triggers, follows the pointer, and restores descriptions", () => {
    reduced = true;
    const { first, second, popup, controller } = setup();
    pointer(first, "pointerover", 160, 80);
    expect(popup.hidden).toBe(true);
    vi.advanceTimersByTime(40);
    expect(popup.textContent).toBe("First");
    expect(popup.style.transform).toBe(
      "translate3d(110px, 48px, 0) rotate(0deg)",
    );
    pointer(first, "pointermove", 200, 90);
    expect(popup.style.transform).toBe(
      "translate3d(150px, 58px, 0) rotate(0deg)",
    );
    pointer(second, "pointerover", 300, 80);
    expect(popup.textContent).toBe("Second");
    expect(document.querySelectorAll('[role="tooltip"]')).toHaveLength(1);
    expect(first.getAttribute("aria-describedby")).toBe("original");
    expect(second.getAttribute("aria-describedby")).toBe(popup.id);
    controller.destroy();
    expect(second.hasAttribute("aria-describedby")).toBe(false);
    expect(document.querySelector('[role="tooltip"]')).toBe(null);
  });
  it("anchors keyboard focus, clamps viewport edges, and dismisses on Escape", () => {
    reduced = true;
    const { first, popup } = setup();
    first.focus();
    expect(popup.hidden).toBe(false);
    expect(popup.style.transform).toBe(
      "translate3d(90px, 68px, 0) rotate(0deg)",
    );
    pointer(first, "pointermove", 500, 600);
    expect(popup.style.transform).toBe(
      "translate3d(90px, 68px, 0) rotate(0deg)",
    );
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(popup.hidden).toBe(true);
    first.blur();
    pointer(first, "pointerover", -20, 1);
    vi.advanceTimersByTime(40);
    expect(popup.style.transform).toBe(
      "translate3d(12px, 12px, 0) rotate(0deg)",
    );
  });
  it("settles a retargeted spring and cancels open work on teardown", () => {
    const { first, second, popup, controller } = setup();
    pointer(first, "pointerover", 160, 80);
    vi.advanceTimersByTime(40);
    pointer(second, "pointerover", 300, 80);
    vi.advanceTimersByTime(1200);
    expect(popup.style.transform).toBe(
      "translate3d(250px, 48px, 0) rotate(0deg)",
    );
    controller.dismiss();
    pointer(first, "pointerover", 160, 80);
    controller.destroy();
    vi.advanceTimersByTime(100);
    expect(document.querySelector('[role="tooltip"]')).toBe(null);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("renders a template as rich content and gives touch pointers nothing", () => {
    reduced = true;
    document.body.innerHTML =
      '<div><button data-reuse-tooltip-template="tip-save">Save</button></div><template id="tip-save"><span class="keys">Save<kbd>S</kbd></span></template>';
    const root = document.body.firstElementChild as HTMLElement;
    const button = root.querySelector("button") as HTMLElement;
    rect(button, 100, 100, 80, 32);
    controllers.push(createFloatingTooltip(root, { delay: 0 }));
    const popup = document.querySelector('[role="tooltip"]') as HTMLElement;
    const touch = new MouseEvent("pointerover", { bubbles: true });
    Object.defineProperty(touch, "pointerType", { value: "touch" });
    button.dispatchEvent(touch);
    expect(popup.hidden).toBe(true);
    pointer(button, "pointerover", 160, 80);
    expect(popup.hidden).toBe(false);
    expect(popup.hasAttribute("data-rich")).toBe(true);
    expect(popup.querySelector(".keys kbd")?.textContent).toBe("S");
    expect(popup.style.transform).toBe(
      "translate3d(170px, 90px, 0) rotate(0deg)",
    );
  });
  it("applies side, offset, and class changes to an open tooltip", () => {
    reduced = true;
    const { first, popup, controller } = setup();
    controller.update({ className: "tip-a" });
    pointer(first, "pointerover", 160, 80);
    vi.advanceTimersByTime(40);
    expect(popup.style.transform).toBe(
      "translate3d(110px, 48px, 0) rotate(0deg)",
    );
    controller.update({
      side: "bottom-right",
      sideOffset: 20,
      className: "tip-b",
    });
    expect(popup.style.transform).toBe(
      "translate3d(180px, 100px, 0) rotate(0deg)",
    );
    expect(popup.classList.contains("tip-a")).toBe(false);
    expect(popup.classList.contains("tip-b")).toBe(true);
    controller.update({ content: () => null });
    controller.refresh();
    expect(popup.hidden).toBe(true);
  });
  it("removes every node and listener it added on destroy", () => {
    const targets = new Map<EventTarget, Set<string>>();
    const track = (target: EventTarget) => {
      const added = new Set<string>();
      targets.set(target, added);
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, "addEventListener").mockImplementation(
        (type, listener, options) => {
          added.add(type);
          add(type, listener, options);
        },
      );
      vi.spyOn(target, "removeEventListener").mockImplementation(
        (type, listener, options) => {
          added.delete(type);
          remove(type, listener, options);
        },
      );
    };
    document.body.innerHTML =
      '<div><button data-reuse-tooltip="First">One</button></div>';
    const root = document.body.firstElementChild as HTMLElement;
    const before = document.documentElement.outerHTML;
    track(root);
    track(window);
    const controller = createFloatingTooltip(root, { delay: 40 });
    const button = root.querySelector("button") as HTMLElement;
    pointer(button, "pointerover", 160, 80);
    vi.advanceTimersByTime(40);
    pointer(button, "pointermove", 220, 80);
    expect(
      document.querySelector('[role="tooltip"]')?.hasAttribute("hidden"),
    ).toBe(false);
    expect(targets.get(root)?.size).toBeGreaterThan(0);
    controller.destroy();
    expect(targets.get(root)?.size).toBe(0);
    expect(targets.get(window)?.size).toBe(0);
    expect(document.documentElement.outerHTML).toBe(before);
    pointer(button, "pointerover", 160, 80);
    vi.advanceTimersByTime(1000);
    expect(document.querySelector('[role="tooltip"]')).toBe(null);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("dismisses a removed trigger even after its spring has settled", async () => {
    reduced = true;
    const { root, first, popup } = setup();
    first.focus();
    root.remove();
    await Promise.resolve();
    expect(popup.hidden).toBe(true);
  });
});

describe("moving highlight", () => {
  function setup(options?: MovingHighlightOptions) {
    document.body.innerHTML =
      '<div style="color: red"><button data-reuse-row data-current>One</button><button data-reuse-row>Two</button><button data-reuse-row disabled>Three</button></div>';
    const root = document.body.firstElementChild as HTMLElement;
    const rows = Array.from(root.querySelectorAll("button"));
    rect(root, 0, 0, 200, 180);
    rows.forEach((row, index) => {
      rect(row, 4, index * 40, 192, 36);
    });
    const controller = createMovingHighlight(root, options);
    controllers.push(controller);
    return {
      root,
      rows,
      fill: root.querySelector(".reuse-moving-highlight") as HTMLElement,
      controller,
    };
  }
  it("appears with a scale-in, slides between rows, and fades out", async () => {
    const { rows, fill } = setup({ className: "tint" });
    expect(fill.classList.contains("tint")).toBe(true);
    expect(fill.dataset.move).toBe("appear");
    expect(fill.dataset.visible).toBe("true");
    pointer(rows[1], "pointerover");
    expect(fill.dataset.move).toBe("slide");
    rows[0].removeAttribute("data-current");
    await Promise.resolve();
    pointer(rows[1], "pointerleave");
    vi.advanceTimersByTime(80);
    expect(fill.dataset.visible).toBe("false");
    expect(fill.dataset.move).toBe("fade");
  });
  it("keeps a selected fill on the selection and ignores pointer and focus", async () => {
    const { rows, fill } = setup({ mode: "selected" });
    pointer(rows[1], "pointerover");
    rows[1].focus();
    expect(fill.style.translate).toBe("4px 0px");
    rows[0].removeAttribute("data-current");
    rows[1].setAttribute("data-current", "");
    await Promise.resolve();
    expect(fill.style.translate).toBe("4px 40px");
  });
  it("runs two fills on one root and restores the root after both are destroyed", async () => {
    const { root, rows, fill, controller } = setup({ mode: "selected" });
    const hover = createMovingHighlight(root, { className: "hover" });
    controllers.push(hover);
    const hoverFill = root.querySelector(".hover") as HTMLElement;
    expect(root.querySelectorAll(".reuse-moving-highlight")).toHaveLength(2);
    pointer(rows[1], "pointerover");
    expect(hoverFill.style.translate).toBe("4px 40px");
    expect(fill.style.translate).toBe("4px 0px");
    hover.destroy();
    expect(hoverFill.isConnected).toBe(false);
    expect(fill.isConnected).toBe(true);
    expect(root.hasAttribute("data-reuse-highlight-root")).toBe(true);
    expect(root.style.isolation).toBe("isolate");
    rows[0].removeAttribute("data-current");
    rows[1].setAttribute("data-current", "");
    await Promise.resolve();
    expect(fill.style.translate).toBe("4px 40px");
    controller.destroy();
    expect(root.getAttribute("style")).toBe("color: red");
    expect(root.hasAttribute("data-reuse-highlight-root")).toBe(false);
    expect(root.querySelector(".reuse-moving-highlight")).toBe(null);
  });
  it("follows pointer and keyboard, ignores disabled rows, and returns to selection", () => {
    const { rows, fill } = setup();
    expect(fill.style.translate).toBe("4px 0px");
    pointer(rows[1], "pointerover");
    expect(fill.style.translate).toBe("4px 40px");
    rows[0].focus();
    expect(fill.style.translate).toBe("4px 0px");
    pointer(rows[1], "pointermove");
    expect(fill.style.translate).toBe("4px 40px");
    pointer(rows[2], "pointerover");
    expect(fill.style.translate).toBe("4px 0px");
  });
  it("measures scaled containers and snaps under reduced motion", () => {
    reduced = true;
    const { root, rows, fill, controller } = setup();
    Object.defineProperty(root, "offsetWidth", { value: 400 });
    Object.defineProperty(root, "offsetHeight", { value: 360 });
    pointer(rows[1], "pointerover");
    expect(fill.style.translate).toBe("8px 80px");
    expect(fill.style.width).toBe("384px");
    expect(fill.dataset.move).toBe("instant");
    controller.destroy();
    expect(root.getAttribute("style")).toBe("color: red");
    expect(root.querySelector(".reuse-moving-highlight")).toBe(null);
    pointer(rows[0], "pointerover");
    expect(root.querySelector(".reuse-moving-highlight")).toBe(null);
  });
  it("updates changing selected data and cancels long-jump timers on teardown", async () => {
    const { root, rows, fill, controller } = setup();
    rows[0].removeAttribute("data-current");
    rows[1].setAttribute("data-current", "");
    await Promise.resolve();
    expect(fill.style.translate).toBe("4px 40px");
    rect(rows[0], 4, 400, 192, 36);
    pointer(rows[0], "pointerover");
    expect(fill.dataset.visible).toBe("false");
    controller.destroy();
    vi.advanceTimersByTime(1000);
    expect(root.children).toHaveLength(3);
    expect(vi.getTimerCount()).toBe(0);
  });
});
