import { escapeHtml } from "@reuse-sh/core/escape-html";
import {
  type Annotation,
  type AnnotationMarkup,
  annotationMarkup,
  annotationsHtml,
  readAnnotation,
} from "./model.js";

export type {
  Annotation,
  AnnotationColor,
  AnnotationKind,
  AnnotationLine,
  AnnotationMarkup,
  PointerSide,
} from "./model.js";
export {
  ANNOTATION_COLORS,
  ANNOTATION_KINDS,
  annotationAttributes,
  annotationNumbers,
  layoutPointers,
  markerHtml,
  markerPlainText,
  parseAnnotationBox,
  parseAnnotationLine,
  parseAnnotationPoint,
  readAnnotation,
} from "./model.js";

export const ANNOTATION_VERSION = 1;

export function parseAnnotations(value: unknown): Annotation[] {
  let list = value;
  if (typeof value === "string") list = JSON.parse(value);
  if (list && !Array.isArray(list) && typeof list === "object") {
    const document = list as Record<string, unknown>;
    if (document.version !== ANNOTATION_VERSION)
      throw new RangeError("Unsupported annotation version.");
    list = document.annotations;
  }
  if (!Array.isArray(list))
    throw new TypeError(
      "Annotations must be an array or a versioned annotation document.",
    );
  return list.flatMap((value: unknown) => {
    if (!value || typeof value !== "object") return [];
    const item = value as Record<string, unknown>;
    const coordinates = (name: string) =>
      Array.isArray(item[name]) ? item[name].join(" ") : "";
    const annotation = readAnnotation({
      kind: typeof item.kind === "string" ? item.kind : "",
      point: coordinates("point"),
      box: coordinates("box"),
      line: coordinates("line"),
      label: typeof item.label === "string" ? item.label : "",
      html: typeof item.text === "string" ? item.text : "",
      side: typeof item.side === "string" ? item.side : "auto",
    });
    return annotation ? [annotation] : [];
  });
}

export function serializeAnnotations(value: unknown): string {
  return JSON.stringify({
    version: ANNOTATION_VERSION,
    annotations: parseAnnotations(value),
  });
}

export function annotationsToHtml(value: unknown): string {
  return annotationsHtml(parseAnnotations(value));
}

export function annotationsFromHtml(root: Element): Annotation[] {
  const list = root.matches("ol[data-annotations]")
    ? root
    : root.querySelector("ol[data-annotations]");
  if (!list) return [];
  return Array.from(list.children).flatMap((item) => {
    if (item.tagName !== "LI") return [];
    const annotation = readAnnotation({
      kind: item.getAttribute("data-kind"),
      point: item.getAttribute("data-point"),
      box: item.getAttribute("data-box"),
      line: item.getAttribute("data-line"),
      side: item.getAttribute("data-side"),
      label: item.textContent,
      html: item.innerHTML,
    });
    return annotation ? [annotation] : [];
  });
}

export interface RenderOptions {
  ratio: number;
  id: string;
  imageWidth?: number;
}

export function renderAnnotations(
  value: unknown,
  options: RenderOptions,
): AnnotationMarkup {
  if (!/^[a-zA-Z][\w:.-]*$/.test(options.id))
    throw new TypeError("Annotation id must be a valid unique identifier.");
  return annotationMarkup(parseAnnotations(value), options.ratio, options);
}

export interface AnnotatedImageOptions {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  annotations: readonly Annotation[];
}

let nextId = 0;

export function createAnnotatedImage(
  root: HTMLElement,
  options: AnnotatedImageOptions,
) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  if (!win) throw new TypeError("The root must belong to a browser document.");
  const initial = {
    ...options,
    annotations: parseAnnotations(options.annotations),
  };
  const original = Array.from(root.childNodes);
  const figure = doc.createElement("figure");
  figure.setAttribute("data-re-annotations", "");
  const stage = doc.createElement("div");
  stage.setAttribute("data-annot-stage", "");
  const media = doc.createElement("div");
  media.setAttribute("data-annot-media", "");
  const image = doc.createElement("img");
  const overlay = doc.createElement("div");
  overlay.setAttribute("data-annotation-overlay", "");
  const drawing = doc.createElement("div");
  const list = doc.createElement("div");
  media.append(image, overlay);
  stage.append(media, drawing);
  figure.append(stage, list);
  root.replaceChildren(figure);
  const id = `re-annotation-${++nextId}`;
  let current = initial;
  let isDestroyed = false;
  let frame = 0;
  let lastWidth = 0;
  const draw = () => {
    if (isDestroyed) return;
    const width = current.width || image.naturalWidth;
    const height = current.height || image.naturalHeight;
    const ratio = width && height ? width / height : 0;
    const rendered = renderAnnotations(current.annotations, {
      ratio,
      id,
      imageWidth: media.clientWidth || width || 640,
    });
    stage.setAttribute("style", rendered.stageStyle ?? "");
    overlay.innerHTML = rendered.overlay;
    drawing.innerHTML = rendered.drawing;
    list.innerHTML = rendered.list;
    figure.toggleAttribute(
      "data-pointer-markers",
      rendered.hasPointerMarkersOnly,
    );
  };
  const update = (next: AnnotatedImageOptions) => {
    if (isDestroyed) return;
    current = { ...next, annotations: parseAnnotations(next.annotations) };
    if (image.getAttribute("src") !== next.src) image.src = next.src;
    image.alt = next.alt;
    if (next.width) image.width = next.width;
    else image.removeAttribute("width");
    if (next.height) image.height = next.height;
    else image.removeAttribute("height");
    draw();
  };
  image.addEventListener("load", draw);
  const observer =
    typeof win.ResizeObserver === "function"
      ? new win.ResizeObserver(() => {
          const width = media.clientWidth;
          if (Math.abs(width - lastWidth) < 0.5) return;
          lastWidth = width;
          win.cancelAnimationFrame(frame);
          frame = win.requestAnimationFrame(draw);
        })
      : null;
  observer?.observe(media);
  update(initial);
  return {
    update,
    destroy() {
      if (isDestroyed) return;
      isDestroyed = true;
      observer?.disconnect();
      win.cancelAnimationFrame(frame);
      image.removeEventListener("load", draw);
      root.replaceChildren(...original);
    },
  };
}

export function annotationImageHtml(
  options: AnnotatedImageOptions & { id: string },
): string {
  const ratio =
    options.width && options.height ? options.width / options.height : 0;
  const rendered = renderAnnotations(options.annotations, {
    ratio,
    id: options.id,
    imageWidth: options.width,
  });
  const style = rendered.stageStyle
    ? ` style="${escapeHtml(rendered.stageStyle)}"`
    : "";
  return `<figure data-re-annotations><div data-annot-stage${style}><div data-annot-media><img src="${escapeHtml(options.src)}" alt="${escapeHtml(options.alt)}"><div data-annotation-overlay>${rendered.overlay}</div></div>${rendered.drawing}</div>${rendered.list}</figure>`;
}

export {
  type AnnotationEditorOptions,
  type AnnotationTool,
  createAnnotationEditor,
} from "./editor.js";
