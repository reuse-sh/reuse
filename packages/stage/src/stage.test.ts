// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  arc,
  createStage,
  cubicBezier,
  isStageEvent,
  moveDuration,
  type Stage,
  type StageAct,
  type StageOptions,
} from "./index.js";

let reduced = false;
const stages: Stage[] = [];
const reported: unknown[] = [];

function rect(
  node: Element,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  Object.defineProperty(node, "getBoundingClientRect", {
    configurable: true,
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
  });
}

function mount(
  html: string,
  options: Partial<StageOptions> & Pick<StageOptions, "script">,
) {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.append(root);
  const stage = createStage(root, {
    width: 200,
    height: 100,
    label: "A test scene",
    delay: 0,
    rest: { x: 180, y: 90 },
    ...options,
  });
  stages.push(stage);
  const scene = root.querySelector(".re-stage-scene") as HTMLElement;
  rect(scene, 0, 0, 200, 100);
  return { root, scene, stage };
}

const tick = (ms: number) => vi.advanceTimersByTimeAsync(ms);

beforeEach(() => {
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "requestAnimationFrame",
      "cancelAnimationFrame",
      "performance",
      "Date",
    ],
  });
  reduced = false;
  reported.length = 0;
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return reduced;
    },
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal("reportError", (error: unknown) => reported.push(error));
});

afterEach(() => {
  for (const stage of stages.splice(0)) stage.destroy();
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("cursor path", () => {
  it("eases like CSS cubic-bezier", () => {
    const ease = cubicBezier(0.25, 0.1, 0.25, 1);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeCloseTo(0.8024, 3);
  });
  it("arcs downward between its ends", () => {
    const right = arc({ x: 0, y: 0 }, { x: 100, y: 0 });
    const left = arc({ x: 100, y: 0 }, { x: 0, y: 0 });
    expect(right(0)).toEqual({ x: 0, y: 0 });
    expect(right(1)).toEqual({ x: 100, y: 0 });
    expect(right(0.5).y).toBeCloseTo(6, 5);
    expect(left(0.5).y).toBeCloseTo(6, 5);
  });
  it("takes longer for a longer reach, within bounds", () => {
    expect(moveDuration(0)).toBe(0);
    expect(moveDuration(4)).toBe(300);
    expect(moveDuration(100)).toBe(540);
    expect(moveDuration(5000)).toBe(900);
  });
});

describe("stage", () => {
  it("presses, releases and clicks the real control under the cursor", async () => {
    const seen: string[] = [];
    let script = true;
    const { root } = mount('<button data-stage-target="save">Save</button>', {
      async script(act) {
        if (!script) return act.wait(10_000);
        script = false;
        await act.click("save");
      },
    });
    const button = root.querySelector("button") as HTMLButtonElement;
    rect(button, 20, 40, 60, 20);
    for (const type of ["pointerover", "pointerdown", "pointerup", "click"])
      button.addEventListener(type, (event) => {
        const pointer = event as PointerEvent;
        seen.push(`${type}:${pointer.pointerId}:${pointer.detail}`);
      });
    await tick(2000);
    expect(seen).toEqual([
      "pointerover:1931:0",
      "pointerdown:1931:0",
      "pointerup:1931:0",
      "click:1931:1",
    ]);
    expect(button.hasAttribute("data-stage-hover")).toBe(false);
  });

  it("marks the events it sends and lets them bubble like real ones", async () => {
    const outside: string[] = [];
    for (const type of ["pointerdown", "pointerup", "click"])
      window.addEventListener(type, (event) =>
        outside.push(`${type}:${isStageEvent(event)}`),
      );
    const { root } = mount('<button data-stage-target="save">Save</button>', {
      async script(act) {
        await act.click("save");
        await act.wait(10_000);
      },
    });
    rect(root.querySelector("button") as Element, 20, 40, 60, 20);
    await tick(2000);
    window.dispatchEvent(new PointerEvent("click"));
    expect(outside).toEqual([
      "pointerdown:true",
      "pointerup:true",
      "click:true",
      "click:false",
    ]);
  });

  it("keeps the pressed look on the pressed control while the cursor drags off it", async () => {
    const seen: boolean[] = [];
    const { root } = mount('<span data-stage-target="grip"></span>', {
      async script(act) {
        await act.press("grip");
        await act.move({ x: 150, y: 80 });
        seen.push(grip.hasAttribute("data-stage-active"));
        await act.release();
        seen.push(grip.hasAttribute("data-stage-active"));
        await act.wait(10_000);
      },
    });
    const grip = root.querySelector("span") as HTMLElement;
    rect(grip, 20, 20, 10, 10);
    await tick(3000);
    expect(seen).toEqual([true, false]);
  });

  it("lands on a target that moves during the move", async () => {
    const { root } = mount('<b data-stage-target="goal"></b>', {
      async script(act) {
        await act.move("goal");
        await act.wait(10_000);
      },
    });
    const goal = root.querySelector("b") as HTMLElement;
    rect(goal, 10, 10, 20, 20);
    await tick(100);
    rect(goal, 120, 60, 20, 20);
    await tick(1500);
    const cursor = root.querySelector(".re-stage-cursor") as HTMLElement;
    expect(cursor.style.transform).toBe("translate(130px, 70px) scale(1)");
  });

  it("resets before every pass and when the page hides mid-pass", async () => {
    let resets = 0;
    let passes = 0;
    mount("<i></i>", {
      reset: () => {
        resets++;
      },
      async script(act) {
        passes++;
        await act.wait(300);
      },
    });
    await tick(3000);
    expect(passes).toBeGreaterThanOrEqual(2);
    expect(resets).toBe(passes);
    const atHide = { resets, passes };
    const visibility = (value: string) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    try {
      visibility("hidden");
      expect(resets).toBe(atHide.resets + 1);
      await tick(3000);
      expect(resets).toBe(atHide.resets + 1);
      expect(passes).toBe(atHide.passes);
    } finally {
      visibility("visible");
    }
    await tick(50);
    expect(passes).toBe(atHide.passes + 1);
  });

  it("shows the still frame and runs nothing under reduced motion", async () => {
    reduced = true;
    const script = vi.fn();
    const still = vi.fn();
    const { stage, root } = mount("<i></i>", { script, still });
    await tick(3000);
    expect(script).not.toHaveBeenCalled();
    expect(still).toHaveBeenCalledOnce();
    expect(stage.status).toBe("still");
    expect(
      root.querySelector(".re-stage-cursor")?.hasAttribute("data-visible"),
    ).toBe(false);
  });

  it("is one labelled picture with nothing to focus", async () => {
    const { root, scene } = mount(
      '<button>Save</button><div tabindex="0" class="canvas"></div><a href="#x">Link</a>',
      { script: (act) => act.wait(10_000) },
    );
    const canvas = scene.querySelector(".canvas") as HTMLElement;
    expect(root.getAttribute("role")).toBe("img");
    expect(root.getAttribute("aria-label")).toBe("A test scene");
    expect(scene.getAttribute("aria-hidden")).toBe("true");
    expect(scene.querySelector("button")?.getAttribute("tabindex")).toBe("-1");
    expect(scene.querySelector("a")?.getAttribute("tabindex")).toBe("-1");
    canvas.tabIndex = 0;
    await Promise.resolve();
    canvas.focus();
    expect(document.activeElement).not.toBe(canvas);
  });

  it("stops on a missing target and reports it instead of looping", async () => {
    const script = vi.fn((act: StageAct) => act.click("nowhere"));
    const reset = vi.fn();
    const { stage } = mount("<i></i>", { script, reset });
    await tick(3000);
    expect(script).toHaveBeenCalledOnce();
    expect(reset).toHaveBeenCalledTimes(2);
    expect(String(reported[0])).toContain('no target "nowhere"');
    expect(stage.status).toBe("waiting");
  });

  it("hands the scene to a visitor's pointer and plays again after it leaves", async () => {
    let aborted = 0;
    let passes = 0;
    const { root, stage } = mount("<i></i>", {
      interactive: true,
      async script(act) {
        passes++;
        act.signal.addEventListener("abort", () => aborted++);
        await act.wait(10_000);
      },
    });
    await tick(100);
    expect(passes).toBe(1);
    root.dispatchEvent(
      new PointerEvent("pointerenter", { pointerType: "mouse" }),
    );
    expect(stage.status).toBe("visitor");
    expect(aborted).toBe(1);
    expect(root.hasAttribute("data-visitor")).toBe(true);
    root.dispatchEvent(
      new PointerEvent("pointerleave", { pointerType: "mouse" }),
    );
    await tick(1100);
    expect(passes).toBe(1);
    await tick(200);
    expect(stage.status).toBe("playing");
    expect(passes).toBe(2);
  });

  it("keeps a touch visitor's scene while focus is inside it", async () => {
    let passes = 0;
    const { root, stage } = mount('<input data-stage-target="email" />', {
      interactive: true,
      async script(act) {
        passes++;
        await act.wait(10_000);
      },
    });
    await tick(100);
    root.dispatchEvent(
      new PointerEvent("pointerdown", { pointerType: "touch" }),
    );
    const field = root.querySelector("input") as HTMLInputElement;
    field.focus();
    await tick(9000);
    expect(stage.status).toBe("visitor");
    field.blur();
    await tick(4000);
    expect(stage.status).toBe("playing");
    expect(passes).toBe(2);
  });

  it("scrolls at once for a zero duration", async () => {
    const seen: number[] = [];
    const { root } = mount('<div data-stage-target="box"></div>', {
      async script(act) {
        await act.scroll("box", { top: 40 }, { duration: 0 });
        seen.push(box.scrollTop);
        await act.wait(10_000);
      },
    });
    const box = root.querySelector("div[data-stage-target]") as HTMLElement;
    await tick(1000);
    expect(seen).toEqual([40]);
  });

  it("follows the newest visibility entry of a batch", async () => {
    let report: (entries: Partial<IntersectionObserverEntry>[]) => void =
      () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof report) {
          report = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { stage } = mount("<i></i>", { script: (act) => act.wait(10_000) });
    report([
      { isIntersecting: false, intersectionRatio: 0 },
      { isIntersecting: true, intersectionRatio: 1 },
    ]);
    expect(stage.status).toBe("playing");
    report([
      { isIntersecting: true, intersectionRatio: 1 },
      { isIntersecting: false, intersectionRatio: 0 },
    ]);
    expect(stage.status).toBe("waiting");
  });

  it("puts the markup back on destroy", async () => {
    const root = document.createElement("div");
    root.className = "demo";
    root.setAttribute("style", "color: red;");
    root.innerHTML =
      '<button tabindex="2">Save</button><div tabindex="0"></div>';
    document.body.append(root);
    const before = root.outerHTML;
    const stage = createStage(root, {
      width: 200,
      height: 100,
      label: "A test scene",
      script: (act) => act.wait(10_000),
    });
    await tick(500);
    stage.destroy();
    expect(root.outerHTML).toBe(before);
  });
});
