import { parseAnnotations } from "./index.js";
import {
  ANNOTATION_KINDS,
  type Annotation,
  type AnnotationKind,
  type PointerSide,
} from "./model.js";

export type AnnotationTool = AnnotationKind | "select";
export interface AnnotationEditorOptions {
  annotations: readonly Annotation[];
  onChange: (annotations: Annotation[]) => void;
  tool?: AnnotationTool;
  onSelectionChange?: (index: number | null) => void;
  onToolChange?: (tool: AnnotationTool) => void;
}

type Point = [number, number];
type Box = [number, number, number, number];
type Corner = "nw" | "ne" | "sw" | "se";
type Gesture = {
  mode: "create" | "move" | "resize" | "end";
  from: Point;
  origin: Annotation[];
  index: number;
  pointerId: number;
  corner?: Corner;
  end?: number;
};

const round = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
const same = (a: readonly Annotation[], b: readonly Annotation[]) =>
  JSON.stringify(a) === JSON.stringify(b);
const copy = (value: readonly Annotation[]) => parseAnnotations(value);

function boxBetween(from: Point, to: Point): Box {
  return [
    Math.min(from[0], to[0]),
    Math.min(from[1], to[1]),
    Math.max(1, Math.abs(to[0] - from[0])),
    Math.max(1, Math.abs(to[1] - from[1])),
  ];
}
function squareCorner(from: Point, to: Point, aspect: number): Point {
  const sx = to[0] < from[0] ? -1 : 1;
  const sy = to[1] < from[1] ? -1 : 1;
  const length = Math.min(
    Math.max(Math.abs(to[0] - from[0]) * aspect, Math.abs(to[1] - from[1])),
    (sx > 0 ? 100 - from[0] : from[0]) * aspect,
    sy > 0 ? 100 - from[1] : from[1],
  );
  return [
    round(from[0] + (sx * length) / aspect),
    round(from[1] + sy * length),
  ];
}
function snapped(from: Point, to: Point, aspect: number): Point {
  const dx = (to[0] - from[0]) * aspect;
  const dy = to[1] - from[1];
  const angle = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * Math.PI) / 4;
  const cx = Math.cos(angle) / aspect;
  const cy = Math.sin(angle);
  let length = dx * Math.cos(angle) + dy * Math.sin(angle);
  for (const [at, step] of [
    [from[0], cx],
    [from[1], cy],
  ]) {
    if (step > 1e-9) length = Math.min(length, (100 - at) / step);
    if (step < -1e-9) length = Math.min(length, -at / step);
  }
  return [round(from[0] + cx * length), round(from[1] + cy * length)];
}
function moved(annotation: Annotation, dx: number, dy: number): Annotation {
  if ("box" in annotation) {
    const [x, y, width, height] = annotation.box;
    return {
      ...annotation,
      box: [
        clamp(x + dx, 0, 100 - width),
        clamp(y + dy, 0, 100 - height),
        width,
        height,
      ],
    };
  }
  if ("point" in annotation)
    return {
      ...annotation,
      point: [
        clamp(annotation.point[0] + dx, 0, 100),
        clamp(annotation.point[1] + dy, 0, 100),
      ],
    };
  const [x1, y1, x2, y2] = annotation.line;
  const ox = clamp(dx, -Math.min(x1, x2), 100 - Math.max(x1, x2));
  const oy = clamp(dy, -Math.min(y1, y2), 100 - Math.max(y1, y2));
  return { ...annotation, line: [x1 + ox, y1 + oy, x2 + ox, y2 + oy] };
}
function created(
  kind: AnnotationKind,
  from: Point,
  to: Point,
  shift: boolean,
  aspect: number,
): Annotation {
  if (kind === "marker") return { kind, point: from, text: "" };
  if (kind === "pointer")
    return { kind, point: from, label: "Label", side: "auto" };
  if (kind === "area" || kind === "spotlight") {
    const end = shift ? squareCorner(from, to, aspect) : to;
    const box: Box =
      Math.abs(from[0] - end[0]) >= 2 && Math.abs(from[1] - end[1]) >= 2
        ? boxBetween(from, end)
        : [clamp(from[0] - 10, 0, 80), clamp(from[1] - 6, 0, 88), 20, 12];
    return kind === "area" ? { kind, box, label: "" } : { kind, box };
  }
  let end = shift ? snapped(from, to, aspect) : to;
  let start = from;
  if (Math.hypot((end[0] - from[0]) * aspect, end[1] - from[1]) < 3) {
    if (kind === "line") {
      start = [clamp(from[0] - 10, 0, 80), from[1]];
      end = [start[0] + 20, from[1]];
    } else {
      end = from;
      start = [
        from[0] >= 12 ? from[0] - 12 : from[0] + 12,
        clamp(
          from[1] + 12 * aspect <= 100
            ? from[1] + 12 * aspect
            : from[1] - 12 * aspect,
          0,
          100,
        ),
      ];
    }
  }
  return { kind, line: [...start, ...end] };
}

export function createAnnotationEditor(
  root: HTMLElement,
  options: AnnotationEditorOptions,
) {
  const view = root.ownerDocument.defaultView;
  if (!view) throw new Error("The editor must belong to a window.");
  let annotations = copy(options.annotations);
  let tool: AnnotationTool = options.tool ?? "select";
  let selected: number | null = null;
  let gesture: Gesture | null = null;
  let preview: Annotation[] | null = null;
  let destroyed = false;
  const undoStack: Annotation[][] = [];
  const redoStack: Annotation[][] = [];
  const originalStyle = root.getAttribute("style");
  const originalTabIndex = root.getAttribute("tabindex");
  const originalTool = root.getAttribute("data-re-annotation-tool");
  const hadClass = root.classList.contains("re-annotation-editor-canvas");
  root.classList.add("re-annotation-editor-canvas");
  if (!root.hasAttribute("tabindex")) root.tabIndex = 0;
  if (
    !view.getComputedStyle(root).position ||
    view.getComputedStyle(root).position === "static"
  )
    root.style.position = "relative";
  const layer = root.ownerDocument.createElement("div");
  layer.className = "re-annotation-edit-layer";
  const media = () =>
    root.querySelector<HTMLElement>("[data-annot-media]") ??
    root.querySelector("img") ??
    root;
  const aspect = () => {
    const box = media().getBoundingClientRect();
    return box.height > 0 ? box.width / box.height : 1;
  };
  const at = (event: { clientX: number; clientY: number }): Point | null => {
    const box = media().getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return null;
    return [
      round(clamp(((event.clientX - box.left) / box.width) * 100, 0, 100)),
      round(clamp(((event.clientY - box.top) / box.height) * 100, 0, 100)),
    ];
  };
  const select = (index: number | null) => {
    if (destroyed) return;
    if (selected === index) return;
    selected = index;
    options.onSelectionChange?.(selected);
  };
  const handle = (index: number, label: string, className: string) => {
    const button = root.ownerDocument.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.reAnnotationIndex = String(index);
    button.setAttribute("aria-label", label);
    return button;
  };
  const draw = () => {
    if (destroyed) return;
    const box = media().getBoundingClientRect();
    const canvas = root.getBoundingClientRect();
    const scaleX =
      root.offsetWidth && canvas.width ? canvas.width / root.offsetWidth : 1;
    const scaleY =
      root.offsetHeight && canvas.height
        ? canvas.height / root.offsetHeight
        : 1;
    layer.style.left = `${(box.left - canvas.left) / scaleX + root.scrollLeft - root.clientLeft}px`;
    layer.style.top = `${(box.top - canvas.top) / scaleY + root.scrollTop - root.clientTop}px`;
    layer.style.width = `${box.width / scaleX}px`;
    layer.style.height = `${box.height / scaleY}px`;
    root.dataset.reAnnotationTool = tool;
    if (layer.parentNode !== root) root.append(layer);
    layer.replaceChildren();
    const shown = preview ?? annotations;
    shown.forEach((annotation, index) => {
      const button = handle(
        index,
        `Select ${annotation.kind} ${index + 1}`,
        "re-annotation-target",
      );
      button.dataset.selected = String(index === selected);
      button.dataset.kind = annotation.kind;
      if ("box" in annotation) {
        const [x, y, width, height] = annotation.box;
        Object.assign(button.style, {
          left: `${x}%`,
          top: `${y}%`,
          width: `${width}%`,
          height: `${height}%`,
        });
      } else if ("point" in annotation) {
        Object.assign(button.style, {
          left: `${annotation.point[0]}%`,
          top: `${annotation.point[1]}%`,
        });
      } else {
        const [x1, y1, x2, y2] = annotation.line;
        const dx = ((x2 - x1) * box.width) / 100;
        const dy = ((y2 - y1) * box.height) / 100;
        Object.assign(button.style, {
          left: `${x1}%`,
          top: `${y1}%`,
          width: `${Math.hypot(dx, dy) / scaleX}px`,
          transform: `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`,
          transformOrigin: "left center",
        });
      }
      layer.append(button);
      if (index !== selected) return;
      if ("box" in annotation) {
        const [x, y, width, height] = annotation.box;
        for (const corner of ["nw", "ne", "sw", "se"] as const) {
          const knob = handle(
            index,
            `Resize ${corner} corner`,
            "re-annotation-resize",
          );
          knob.dataset.corner = corner;
          Object.assign(knob.style, {
            left: `${x + (corner.includes("e") ? width : 0)}%`,
            top: `${y + (corner.includes("s") ? height : 0)}%`,
          });
          layer.append(knob);
        }
      } else if ("line" in annotation) {
        for (const end of [0, 1]) {
          const knob = handle(
            index,
            `Move ${end === 0 ? "start" : "end"} point`,
            "re-annotation-resize",
          );
          knob.dataset.end = String(end);
          knob.style.left = `${annotation.line[end * 2]}%`;
          knob.style.top = `${annotation.line[end * 2 + 1]}%`;
          layer.append(knob);
        }
      }
    });
  };
  const publish = (next: readonly Annotation[], record = true) => {
    if (destroyed) return;
    const clean = copy(next);
    if (same(annotations, clean)) {
      preview = null;
      draw();
      return;
    }
    if (record) {
      undoStack.push(copy(annotations));
      redoStack.length = 0;
    }
    annotations = clean;
    preview = null;
    if (selected !== null && !annotations[selected]) select(null);
    draw();
    options.onChange(copy(annotations));
  };
  const cancel = () => {
    gesture = null;
    preview = null;
    draw();
  };
  const setTool = (next: AnnotationTool) => {
    if (
      next !== "select" &&
      !(ANNOTATION_KINDS as readonly string[]).includes(next)
    )
      throw new TypeError("Unknown annotation tool.");
    cancel();
    tool = next;
    draw();
  };
  const start = (event: PointerEvent) => {
    if (destroyed || gesture || event.button !== 0 || event.isPrimary === false)
      return;
    const point = at(event);
    if (!point || !(event.target instanceof view.Element)) return;
    const target = event.target.closest<HTMLElement>(
      "[data-re-annotation-index]",
    );
    if (!layer.contains(event.target)) return;
    event.preventDefault();
    root.focus({ preventScroll: true });
    if (tool !== "select") {
      const index = annotations.length;
      gesture = {
        mode: "create",
        from: point,
        origin: copy(annotations),
        index,
        pointerId: event.pointerId,
      };
      select(index);
      preview = [
        ...copy(annotations),
        created(tool, point, point, event.shiftKey, aspect()),
      ];
    } else {
      if (!target) {
        select(null);
        draw();
        return;
      }
      const index = Number(target.dataset.reAnnotationIndex);
      if (!annotations[index]) return;
      select(index);
      gesture = {
        mode: target.dataset.corner
          ? "resize"
          : target.dataset.end
            ? "end"
            : "move",
        from: point,
        origin: copy(annotations),
        index,
        pointerId: event.pointerId,
        corner: target.dataset.corner as Corner | undefined,
        end:
          target.dataset.end === undefined
            ? undefined
            : Number(target.dataset.end),
      };
    }
    draw();
  };
  const move = (event: PointerEvent) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const point = at(event);
    if (!point) return;
    event.preventDefault();
    const { from, origin, index, mode } = gesture;
    if (mode === "create" && tool !== "select")
      preview = [
        ...origin,
        created(tool, from, point, event.shiftKey, aspect()),
      ];
    else {
      const annotation = origin[index];
      if (!annotation) return;
      let dx = point[0] - from[0];
      let dy = point[1] - from[1];
      let next = annotation;
      if (mode === "move") {
        if (event.shiftKey) {
          if (Math.abs(dx) * aspect() > Math.abs(dy)) dy = 0;
          else dx = 0;
        }
        next = moved(annotation, dx, dy);
      } else if (mode === "resize" && "box" in annotation && gesture.corner) {
        const [x, y, width, height] = annotation.box;
        const corner = gesture.corner;
        const fixed: Point = [
          corner.includes("w") ? x + width : x,
          corner.includes("n") ? y + height : y,
        ];
        let end: Point = [
          clamp(
            (corner.includes("w") ? x : x + width) + dx,
            corner.includes("w") ? 0 : x + 1,
            corner.includes("w") ? x + width - 1 : 100,
          ),
          clamp(
            (corner.includes("n") ? y : y + height) + dy,
            corner.includes("n") ? 0 : y + 1,
            corner.includes("n") ? y + height - 1 : 100,
          ),
        ];
        if (event.shiftKey) end = squareCorner(fixed, end, aspect());
        next = { ...annotation, box: boxBetween(fixed, end) };
      } else if (mode === "end" && "line" in annotation) {
        const line = [...annotation.line] as Box;
        const offset = gesture.end === 0 ? 0 : 2;
        const fixed: Point =
          gesture.end === 0 ? [line[2], line[3]] : [line[0], line[1]];
        const end = event.shiftKey ? snapped(fixed, point, aspect()) : point;
        if (end[0] === fixed[0] && end[1] === fixed[1]) return;
        line[offset] = end[0];
        line[offset + 1] = end[1];
        next = { ...annotation, line };
      }
      preview = origin.map((item, atIndex) =>
        atIndex === index ? next : item,
      );
    }
    draw();
  };
  const finish = (event: PointerEvent) => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    move(event);
    const next = preview;
    const wasCreate = gesture.mode === "create";
    gesture = null;
    if (next) publish(next);
    if (wasCreate) {
      tool = "select";
      options.onToolChange?.(tool);
      draw();
    }
  };
  const removeSelection = () => {
    if (selected === null) return;
    const index = selected;
    select(null);
    publish(annotations.filter((_, atIndex) => atIndex !== index));
  };
  const undo = () => {
    cancel();
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push(copy(annotations));
    select(null);
    publish(previous, false);
  };
  const redo = () => {
    cancel();
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(copy(annotations));
    select(null);
    publish(next, false);
  };
  const key = (event: KeyboardEvent) => {
    if (
      event.target instanceof view.Element &&
      event.target.closest("input,textarea,select,[contenteditable=true]")
    )
      return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancel();
      select(null);
      setTool("select");
      options.onToolChange?.("select");
      return;
    }
    if (tool !== "select" && event.key === "Enter") {
      event.preventDefault();
      select(annotations.length);
      publish([
        ...annotations,
        created(tool, [50, 50], [50, 50], false, aspect()),
      ]);
      tool = "select";
      options.onToolChange?.(tool);
      draw();
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      removeSelection();
      return;
    }
    if (
      event.target instanceof view.HTMLElement &&
      event.target.dataset.reAnnotationIndex &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      select(Number(event.target.dataset.reAnnotationIndex));
      root.focus();
      draw();
      return;
    }
    if (selected === null || !annotations[selected] || gesture) return;
    const step = event.shiftKey ? 5 : 0.5;
    const delta: Record<string, Point> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const nudge = delta[event.key];
    if (!nudge) return;
    event.preventDefault();
    publish(
      annotations.map((annotation, index) =>
        index === selected ? moved(annotation, ...nudge) : annotation,
      ),
    );
  };
  const onCancel = () => {
    if (gesture) cancel();
  };
  const refresh = () => draw();
  const observer = new view.MutationObserver((records) => {
    if (!records.every((record) => layer.contains(record.target))) draw();
  });
  observer.observe(root, { childList: true, subtree: true });
  const resizeObserver =
    typeof view.ResizeObserver === "function"
      ? new view.ResizeObserver(refresh)
      : null;
  resizeObserver?.observe(root);
  root.addEventListener("pointerdown", start);
  root.addEventListener("keydown", key);
  view.addEventListener("pointermove", move, { passive: false });
  view.addEventListener("pointerup", finish);
  view.addEventListener("pointercancel", onCancel);
  view.addEventListener("blur", onCancel);
  view.addEventListener("resize", refresh);
  draw();
  return {
    setTool,
    setAnnotations(value: readonly Annotation[]) {
      if (destroyed) return;
      const next = copy(value);
      if (same(annotations, next)) return;
      cancel();
      annotations = next;
      undoStack.length = 0;
      redoStack.length = 0;
      if (selected !== null && !annotations[selected]) select(null);
      draw();
    },
    getAnnotations: () => copy(annotations),
    getSelection: () => selected,
    select(index: number | null) {
      if (index !== null && !annotations[index]) return;
      select(index);
      draw();
    },
    updateSelection(value: {
      label?: string;
      text?: string;
      side?: PointerSide;
    }) {
      if (selected === null) return;
      publish(
        annotations.map((annotation, index) => {
          if (index !== selected) return annotation;
          if (annotation.kind === "marker")
            return { ...annotation, text: value.text ?? annotation.text };
          if (annotation.kind === "pointer")
            return {
              ...annotation,
              label: value.label?.trim() ? value.label : annotation.label,
              side: value.side ?? annotation.side,
            };
          if (annotation.kind === "area")
            return { ...annotation, label: value.label ?? annotation.label };
          return annotation;
        }),
      );
    },
    removeSelection,
    undo,
    redo,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      gesture = null;
      preview = null;
      observer.disconnect();
      resizeObserver?.disconnect();
      root.removeEventListener("pointerdown", start);
      root.removeEventListener("keydown", key);
      view.removeEventListener("pointermove", move);
      view.removeEventListener("pointerup", finish);
      view.removeEventListener("pointercancel", onCancel);
      view.removeEventListener("blur", onCancel);
      view.removeEventListener("resize", refresh);
      layer.remove();
      if (!hadClass) root.classList.remove("re-annotation-editor-canvas");
      for (const [name, value] of [
        ["style", originalStyle],
        ["tabindex", originalTabIndex],
        ["data-re-annotation-tool", originalTool],
      ] as const) {
        if (value === null) root.removeAttribute(name);
        else root.setAttribute(name, value);
      }
    },
  };
}
