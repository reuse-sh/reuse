// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { type AnnotationTool, createAnnotationEditor } from "./editor.js";
import { createAnnotatedImage } from "./index.js";
import type { Annotation } from "./model.js";

const controllers: Array<{ destroy(): void }> = [];
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
function pointer(
  target: EventTarget,
  type: string,
  x: number,
  y: number,
  shiftKey = false,
  pointerId = 1,
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 10 + x * 2,
    clientY: 20 + y,
    shiftKey,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  target.dispatchEvent(event);
}
function setup(initial: Annotation[] = []) {
  const root = document.createElement("div");
  root.style.color = "red";
  document.body.append(root);
  const imageOptions = {
    src: "/example.webp",
    alt: "Example dashboard",
    width: 200,
    height: 100,
    annotations: initial,
  };
  const renderer = createAnnotatedImage(root, imageOptions);
  controllers.push(renderer);
  const media = root.querySelector("[data-annot-media]");
  if (!media) throw new Error("Media is missing");
  rect(root, 10, 20, 200, 100);
  rect(media, 10, 20, 200, 100);
  const changes: Annotation[][] = [];
  const tools: AnnotationTool[] = [];
  const controller = createAnnotationEditor(root, {
    annotations: initial,
    onChange(next) {
      changes.push(next);
      renderer.update({ ...imageOptions, annotations: next });
    },
    onToolChange(next) {
      tools.push(next);
    },
  });
  controllers.push(controller);
  const layer = () =>
    root.querySelector(".reuse-annotation-edit-layer") as HTMLElement;
  function gesture(
    tool: AnnotationTool,
    from: [number, number],
    to = from,
    shift = false,
  ) {
    controller.setTool(tool);
    pointer(layer(), "pointerdown", ...from, shift);
    pointer(window, "pointermove", ...to, shift);
    pointer(window, "pointerup", ...to, shift);
  }
  function mark(index: number) {
    return root.querySelector(
      `[data-reuse-annotation-index="${index}"]`,
    ) as HTMLElement;
  }
  return { root, media, layer, controller, changes, tools, gesture, mark };
}
afterEach(() => {
  for (const controller of controllers.splice(0).reverse())
    controller.destroy();
  document.body.replaceChildren();
});

describe("annotation creation", () => {
  it.each([
    ["area", { kind: "area", box: [10, 20, 40, 40], label: "" }],
    ["spotlight", { kind: "spotlight", box: [10, 20, 40, 40] }],
    ["arrow", { kind: "arrow", line: [10, 20, 50, 60] }],
    ["line", { kind: "line", line: [10, 20, 50, 60] }],
    [
      "pointer",
      { kind: "pointer", point: [10, 20], label: "Label", side: "auto" },
    ],
    ["marker", { kind: "marker", point: [10, 20], text: "" }],
  ] as const)(
    "creates %s in percentage coordinates through the real renderer",
    (kind, expected) => {
      const { controller, gesture, changes, tools, root } = setup();
      gesture(kind, [10, 20], [50, 60]);
      expect(controller.getAnnotations()).toEqual([expected]);
      expect(controller.getSelection()).toBe(0);
      expect(changes).toEqual([[expected]]);
      expect(tools).toEqual(["select"]);
      expect(root.querySelector('[data-index="0"]')).not.toBe(null);
    },
  );
  it("creates a mark without a pointer and then moves it with the keyboard", () => {
    const { root, controller } = setup();
    controller.setTool("marker");
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(controller.getAnnotations()).toEqual([
      { kind: "marker", point: [50.5, 50], text: "" },
    ]);
    controller.undo();
    controller.undo();
    expect(controller.getAnnotations()).toEqual([]);
  });
  it("normalizes reverse box drags and provides click placement for shapes", () => {
    const { controller, gesture } = setup();
    gesture("area", [50, 60], [10, 20]);
    gesture("line", [95, 50]);
    gesture("spotlight", [99, 99]);
    expect(controller.getAnnotations()).toEqual([
      { kind: "area", box: [10, 20, 40, 40], label: "" },
      { kind: "line", line: [80, 50, 100, 50] },
      { kind: "spotlight", box: [80, 88, 20, 12] },
    ]);
  });
  it("constrains squares and line angles in screen pixels on a non-square image", () => {
    const { controller, gesture } = setup();
    gesture("area", [10, 10], [30, 20], true);
    gesture("line", [10, 10], [40, 20], true);
    const list = controller.getAnnotations();
    expect(list[0]).toEqual({ kind: "area", box: [10, 10, 20, 40], label: "" });
    expect(list[1]).toEqual({ kind: "line", line: [10, 10, 40, 10] });
  });
  it("does not start editing a zero-sized image", () => {
    const { media, layer, controller, changes } = setup();
    rect(media, 10, 20, 0, 0);
    controller.setTool("marker");
    pointer(layer(), "pointerdown", 20, 20);
    pointer(window, "pointerup", 20, 20);
    expect(changes).toEqual([]);
    expect(controller.getAnnotations()).toEqual([]);
  });
});

describe("annotation editing", () => {
  it("moves an entire line within bounds and treats a drag as one undo entry", () => {
    const initial: Annotation[] = [{ kind: "line", line: [10, 20, 50, 60] }];
    const { controller, mark, changes } = setup(initial);
    pointer(mark(0), "pointerdown", 20, 30);
    pointer(window, "pointermove", 60, 90);
    pointer(window, "pointermove", 90, 90);
    expect(changes).toHaveLength(0);
    pointer(window, "pointerup", 90, 90);
    expect(controller.getAnnotations()).toEqual([
      { kind: "line", line: [60, 60, 100, 100] },
    ]);
    expect(changes).toHaveLength(1);
    controller.undo();
    expect(controller.getAnnotations()).toEqual(initial);
    controller.redo();
    expect(controller.getAnnotations()).toEqual([
      { kind: "line", line: [60, 60, 100, 100] },
    ]);
  });
  it("resizes a selected box and moves an arrow endpoint without collapsing its line", () => {
    const { controller, root } = setup([
      { kind: "area", box: [10, 20, 30, 40], label: "Original" },
      { kind: "arrow", line: [10, 20, 50, 60] },
    ]);
    controller.select(0);
    const corner = root.querySelector('[data-corner="se"]');
    if (!corner) throw new Error("Resize corner missing");
    pointer(corner, "pointerdown", 40, 60);
    pointer(window, "pointerup", 60, 80);
    expect(controller.getAnnotations()[0]).toEqual({
      kind: "area",
      box: [10, 20, 50, 60],
      label: "Original",
    });
    controller.select(1);
    const end = root.querySelector('[data-end="1"]');
    if (!end) throw new Error("Endpoint missing");
    pointer(end, "pointerdown", 50, 60);
    pointer(window, "pointerup", 70, 80);
    expect(controller.getAnnotations()[1]).toEqual({
      kind: "arrow",
      line: [10, 20, 70, 80],
    });
  });
  it.each(["Escape", "pointercancel", "blur"])(
    "discards an unfinished gesture on %s",
    (reason) => {
      const { controller, gesture, layer, changes, root } = setup();
      gesture("marker", [20, 30]);
      controller.setTool("area");
      pointer(layer(), "pointerdown", 10, 10);
      pointer(window, "pointermove", 50, 50);
      if (reason === "Escape")
        root.dispatchEvent(
          new KeyboardEvent("keydown", { key: reason, bubbles: true }),
        );
      else window.dispatchEvent(new Event(reason));
      pointer(window, "pointerup", 50, 50);
      expect(controller.getAnnotations()).toEqual([
        { kind: "marker", point: [20, 30], text: "" },
      ]);
      expect(changes).toHaveLength(1);
    },
  );
  it("supports keyboard selection, precise and large nudges, deletion and history", () => {
    const { controller, root, mark } = setup([
      { kind: "marker", point: [20, 30], text: "" },
    ]);
    mark(0).dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
    );
    expect(controller.getSelection()).toBe(0);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "ArrowDown",
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(controller.getAnnotations()).toEqual([
      { kind: "marker", point: [20.5, 35], text: "" },
    ]);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Delete", bubbles: true }),
    );
    expect(controller.getAnnotations()).toEqual([]);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }),
    );
    expect(controller.getAnnotations()).toEqual([
      { kind: "marker", point: [20.5, 35], text: "" },
    ]);
    root.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );
    expect(controller.getAnnotations()).toEqual([]);
  });
  it("sanitizes text edits and keeps pointer labels valid", () => {
    const { controller, root } = setup([
      { kind: "marker", point: [20, 30], text: "" },
      { kind: "pointer", point: [30, 40], label: "Original", side: "auto" },
    ]);
    controller.select(0);
    controller.updateSelection({
      text: '<strong onclick="evil()">Safe</strong><img src=x onerror=evil()>',
    });
    expect(controller.getAnnotations()[0]).toEqual({
      kind: "marker",
      point: [20, 30],
      text: "<strong>Safe</strong>",
    });
    expect(root.querySelector("[data-annot-text]")?.innerHTML).toBe(
      "<strong>Safe</strong>",
    );
    expect(root.querySelector("[onclick],[onerror]")).toBe(null);
    controller.select(1);
    controller.updateSelection({ label: "", side: "left" });
    expect(controller.getAnnotations()[1]).toEqual({
      kind: "pointer",
      point: [30, 40],
      label: "Original",
      side: "left",
    });
    controller.updateSelection({ label: "  Updated   label  " });
    expect(controller.getAnnotations()[1]).toEqual({
      kind: "pointer",
      point: [30, 40],
      label: "Updated label",
      side: "left",
    });
  });
  it("preserves history on a controlled echo and resets it for an external document", () => {
    const { controller, gesture } = setup();
    gesture("marker", [20, 30]);
    controller.setAnnotations(controller.getAnnotations());
    controller.undo();
    expect(controller.getAnnotations()).toEqual([]);
    controller.setAnnotations([{ kind: "spotlight", box: [10, 10, 30, 30] }]);
    controller.undo();
    expect(controller.getAnnotations()).toEqual([
      { kind: "spotlight", box: [10, 10, 30, 30] },
    ]);
  });
  it("restores host styles, removes listeners, and prevents callbacks after destroy", () => {
    const { root, layer, controller, changes } = setup();
    controller.setTool("marker");
    pointer(layer(), "pointerdown", 20, 30);
    controller.destroy();
    pointer(window, "pointerup", 20, 30);
    root.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Delete", bubbles: true }),
    );
    controller.updateSelection({ text: "Detached" });
    controller.setAnnotations([
      { kind: "marker", point: [10, 20], text: "Ignored" },
    ]);
    expect(changes).toEqual([]);
    expect(root.querySelector(".reuse-annotation-edit-layer")).toBe(null);
    expect(root.getAttribute("style")).toBe("color: red;");
    expect(root.hasAttribute("tabindex")).toBe(false);
    expect(root.hasAttribute("data-reuse-annotation-tool")).toBe(false);
  });
});
