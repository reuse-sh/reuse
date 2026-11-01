import { escapeHtml } from "@reuse-sh/core/escape-html";

/**
 * Annotations on an article image (specs/025):
 *
 * - an area, outlined, with an optional label;
 * - a spotlight, which darkens the image everywhere outside it;
 * - an arrow, and a plain line, drawn from one point on the image to another;
 * - a pointer, whose label sits beside, above or below the image with a line
 *   to its point;
 * - a numbered marker, its text listed under the image.
 *
 * They are stored in the image's figure as `<ol data-annotations>`, one
 * `<li data-kind data-point|data-box|data-line>` each. An area's or a pointer's `<li>`
 * holds its label as text; a marker's holds its text as inline HTML, bold,
 * italic and code only. Positions are percentages of the image, so they follow
 * it at any size. The figure's `data-annot-color` picks their colour.
 *
 * The editor, publish and Markdown read and write them through this module,
 * and publish and the editor draw them with `annotationMarkup`, so the drawing
 * is the same everywhere.
 */

export const POINTER_SIDES = [
  "auto",
  "left",
  "right",
  "top",
  "bottom",
] as const;

export type PointerSide = (typeof POINTER_SIDES)[number];

export type Annotation =
  | {
      kind: "area";

      box: [number, number, number, number];
      label: string;
    }
  | { kind: "spotlight"; box: [number, number, number, number] }
  /** An arrow points at its line's second point. */
  | { kind: "arrow"; line: AnnotationLine }
  | { kind: "line"; line: AnnotationLine }
  | {
      kind: "pointer";
      point: [number, number];
      label: string;
      side: PointerSide;
    }
  | {
      kind: "marker";
      point: [number, number];
      /** Inline HTML, see `markerHtml`. */
      text: string;
    };

export type AnnotationKind = Annotation["kind"];

export type AnnotationLine = [number, number, number, number];

export const ANNOTATION_KINDS = [
  "area",
  "spotlight",
  "arrow",
  "line",
  "pointer",
  "marker",
] as const satisfies readonly AnnotationKind[];

export const ANNOTATION_COLORS = [
  "accent",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
] as const;

export type AnnotationColor = (typeof ANNOTATION_COLORS)[number];

export const ANNOTATION_COLOR_LABELS: Record<AnnotationColor, string> = {
  accent: "Accent",
  red: "Red",
  orange: "Orange",
  yellow: "Yellow",
  green: "Green",
  blue: "Blue",
  purple: "Purple",
};

export function annotationColor(value: unknown): AnnotationColor {
  return (ANNOTATION_COLORS as readonly unknown[]).includes(value)
    ? (value as AnnotationColor)
    : "accent";
}

const LABEL_MAX = 120;
const TEXT_MAX = 300;

const round = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

function numbers(value: string | null | undefined, count: number) {
  const parts = (value ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  return parts.length === count && parts.every(Number.isFinite) ? parts : null;
}

/** `x y` as a point on the image, each within 0 to 100. */
export function parseAnnotationPoint(
  value: string | null | undefined,
): [number, number] | null {
  const parts = numbers(value, 2);
  if (!parts) return null;
  const [x = 0, y = 0] = parts;
  return [round(clamp(x, 0, 100)), round(clamp(y, 0, 100))];
}

/** `left top width height` as an area inside the image, at least 1 each way. */
export function parseAnnotationBox(
  value: string | null | undefined,
): [number, number, number, number] | null {
  const parts = numbers(value, 4);
  if (!parts) return null;
  const [left = 0, top = 0, width = 0, height = 0] = parts;
  const l = round(clamp(left, 0, 99));
  const t = round(clamp(top, 0, 99));
  return [
    l,
    t,
    round(clamp(width, 1, 100 - l)),
    round(clamp(height, 1, 100 - t)),
  ];
}

/** `x1 y1 x2 y2` as a line on the image, its ends apart and within 0 to 100. */
export function parseAnnotationLine(
  value: string | null | undefined,
): AnnotationLine | null {
  const parts = numbers(value, 4);
  if (!parts) return null;
  const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = parts.map((part) =>
    round(clamp(part, 0, 100)),
  );
  return x1 === x2 && y1 === y2 ? null : [x1, y1, x2, y2];
}

export function formatAnnotationNumbers(values: readonly number[]): string {
  return values.map((value) => String(round(value))).join(" ");
}

const text = (value: string | null | undefined, max: number) =>
  (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string) {
  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, name: string) => {
      if (name[0] === "#") {
        const code =
          name[1] === "x" || name[1] === "X"
            ? Number.parseInt(name.slice(2), 16)
            : Number(name.slice(1));
        return Number.isInteger(code) && code > 0 && code < 0x110000
          ? String.fromCodePoint(code)
          : entity;
      }
      return ENTITIES[name.toLowerCase()] ?? entity;
    },
  );
}

const MARKER_TAGS: Record<string, "strong" | "em" | "code"> = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  code: "code",
};

/**
 * A marker's text as the only HTML it may hold: bold, italic and code, no
 * attributes, every tag closed, whitespace collapsed, at most 300 characters
 * of text. Takes what an editable field, Markdown or a stored `<li>` gives,
 * and drops any other tag but keeps its text.
 */
export function markerHtml(value: string | null | undefined): string {
  const open: string[] = [];
  let html = "";
  let length = 0;
  const pieces = (value ?? "").split(/(<\/?[a-zA-Z][^>]*>)/);
  for (const piece of pieces) {
    const tag = /^<(\/?)([a-zA-Z]+)/.exec(piece);
    if (tag) {
      const name = MARKER_TAGS[tag[2]?.toLowerCase() ?? ""];
      if (tag[2]?.toLowerCase() === "br") {
        html += " ";
        continue;
      }
      if (!name) continue;
      if (!tag[1]) {
        open.push(name);
        html += `<${name}>`;
      } else if (open.at(-1) === name) {
        open.pop();
        html += `</${name}>`;
      }
      continue;
    }
    const plain = decodeEntities(piece).replace(/\s+/g, " ");
    const room = TEXT_MAX - length;
    if (room <= 0) continue;
    const kept = plain.slice(0, room);
    length += kept.length;
    html += escapeHtml(kept);
  }
  while (open.length) html += `</${open.pop()}>`;
  return html.replace(/<(strong|em|code)>\s*<\/\1>/g, "").trim();
}

export function markerPlainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ""));
}

export function readAnnotation(parts: {
  kind: string | null | undefined;
  point?: string | null;
  box?: string | null;
  line?: string | null;

  label?: string | null;
  /** A marker's text, as inline HTML. */
  html?: string | null;
  side?: string | null;
}): Annotation | null {
  if (parts.kind === "area" || parts.kind === "spotlight") {
    const box = parseAnnotationBox(parts.box);
    if (!box) return null;
    return parts.kind === "area"
      ? { kind: "area", box, label: text(parts.label, LABEL_MAX) }
      : { kind: "spotlight", box };
  }
  if (parts.kind === "arrow" || parts.kind === "line") {
    const line = parseAnnotationLine(parts.line);
    return line ? { kind: parts.kind, line } : null;
  }
  const point = parseAnnotationPoint(parts.point);
  if (!point) return null;
  if (parts.kind === "pointer") {
    const label = text(parts.label, LABEL_MAX);
    const side = (POINTER_SIDES as readonly unknown[]).includes(parts.side)
      ? (parts.side as PointerSide)
      : "auto";
    return label ? { kind: "pointer", point, label, side } : null;
  }
  if (parts.kind === "marker") {
    return { kind: "marker", point, text: markerHtml(parts.html) };
  }
  return null;
}

export function annotationAttributes(
  annotation: Annotation,
): Record<string, string> {
  if (annotation.kind === "area" || annotation.kind === "spotlight") {
    return {
      "data-kind": annotation.kind,
      "data-box": formatAnnotationNumbers(annotation.box),
    };
  }
  if (annotation.kind === "arrow" || annotation.kind === "line") {
    return {
      "data-kind": annotation.kind,
      "data-line": formatAnnotationNumbers(annotation.line),
    };
  }
  return {
    "data-kind": annotation.kind,
    "data-point": formatAnnotationNumbers(annotation.point),
    ...(annotation.kind === "pointer" && annotation.side !== "auto"
      ? { "data-side": annotation.side }
      : {}),
  };
}

/** What one stored `<li>` holds, as HTML. */
export function annotationContent(annotation: Annotation): string {
  if (
    annotation.kind === "spotlight" ||
    annotation.kind === "arrow" ||
    annotation.kind === "line"
  )
    return "";
  return annotation.kind === "marker"
    ? annotation.text
    : escapeHtml(annotation.label);
}

export function annotationsHtml(annotations: readonly Annotation[]): string {
  return annotations.length
    ? `<ol data-annotations>${annotations
        .map(
          (annotation) =>
            `<li${Object.entries(annotationAttributes(annotation))
              .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
              .join("")}>${annotationContent(annotation)}</li>`,
        )
        .join("")}</ol>`
    : "";
}

/**
 * The number each marker shows, and each pointer when it turns into a marker
 * on a narrow screen: markers first in their order, then pointers.
 */
export function annotationNumbers(
  annotations: readonly Annotation[],
): Map<number, number> {
  const numbersByIndex = new Map<number, number>();
  for (const kind of ["marker", "pointer"] as const) {
    annotations.forEach((annotation, index) => {
      if (annotation.kind === kind) {
        numbersByIndex.set(index, numbersByIndex.size + 1);
      }
    });
  }
  return numbersByIndex;
}

/*
 * The drawing's units are CSS pixels: labels, gaps and lines keep one size
 * however wide the image is shown, and the image takes what is left. The
 * page lays a drawing out again for the width it actually shows the image at
 * (`pointerDrawing`); publish lays it out for its likeliest width first.
 */

export const POINTER_GUTTER = 150;
/** The width publish lays an image out for, before the page measures it. */
export const ANNOTATION_IMAGE_WIDTH = 440;

const LINE_REACH = 18;

const LABEL_GAP = 24;
const EDGE_PAD = 4;

const BAND_TEXT_WIDTH = 220;
const FONT_SIZE = 14;
const LINE_HEIGHT = 19;
/** An average character, for wrapping before any font has loaded. */
const CHARACTER_WIDTH = 7.3;
const LABEL_SPACING = 8;
const BEND = 10;

const TIP = 4.5;

type Side = Exclude<PointerSide, "auto">;

export type PlacedPointer = {
  index: number;
  point: [number, number];
  label: string;
  side: PointerSide;
};

export type PointerLabel = {
  index: number;
  side: Side;
  lines: string[];

  x: number;
  top: number;
  point: [number, number];

  path: string;
};

export type PointerLayout = {
  width: number;
  height: number;

  image: { left: number; top: number; width: number; height: number };
  fontSize: number;
  lineHeight: number;
  labels: PointerLabel[];
};

function wrap(label: string, width: number): string[] {
  const max = Math.max(4, Math.floor(width / CHARACTER_WIDTH));
  const lines: string[] = [];
  let line = "";
  for (const word of label.split(" ")) {
    let rest = word;
    while (rest.length > max) {
      if (line) {
        lines.push(line);
        line = "";
      }
      lines.push(rest.slice(0, max));
      rest = rest.slice(max);
    }
    if (!line) line = rest;
    else if (line.length + 1 + rest.length <= max) line = `${line} ${rest}`;
    else {
      lines.push(line);
      line = rest;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function pointerSide(
  annotation: Pick<PlacedPointer, "point" | "side">,
): Side {
  if (annotation.side !== "auto") return annotation.side;
  return annotation.point[0] < 50 ? "left" : "right";
}

export function placedPointers(
  annotations: readonly Annotation[],
): PlacedPointer[] {
  return annotations.flatMap((annotation, index) =>
    annotation.kind === "pointer"
      ? [
          {
            index,
            point: annotation.point,
            label: annotation.label,
            side: annotation.side,
          },
        ]
      : [],
  );
}

/** The margins beside the image its pointers' labels take, in pixels. */
export function pointerGutters(pointers: readonly PlacedPointer[]): {
  left: number;
  right: number;
} {
  const has = (side: Side) =>
    pointers.some((pointer) => pointerSide(pointer) === side);
  return {
    left: has("left") ? POINTER_GUTTER : 0,
    right: has("right") ? POINTER_GUTTER : 0,
  };
}

/**
 * Where each pointer's label goes, for an image of this width-to-height
 * ratio shown `imageWidth` pixels wide. Labels beside the image sit in its
 * left or right margin, keep their order and never overlap, and the drawing
 * grows below the image when they need the room; their lines run straight
 * across the image at their point's height and bend only near the label.
 * Labels above or below sit in a band there, centred on their point, a row
 * further out when they would overlap; their lines run straight up or down.
 * Null when there is no pointer or no known ratio.
 */
export function layoutPointers(
  pointers: readonly PlacedPointer[],
  ratio: number,
  imageWidth = ANNOTATION_IMAGE_WIDTH,
): PointerLayout | null {
  if (
    pointers.length === 0 ||
    !(ratio > 0) ||
    !Number.isFinite(ratio) ||
    !(imageWidth > 0)
  ) {
    return null;
  }
  const sided = pointers.map((pointer) => ({
    ...pointer,
    side: pointerSide(pointer),
  }));
  const { left, right } = pointerGutters(pointers);
  const stageWidth = left + imageWidth + right;
  const imageHeight = imageWidth / ratio;
  const labels: PointerLabel[] = [];

  // Above and below: rows outward from the image, each label on the first row
  // it fits in beside the ones already there.
  const bands = { top: 0, bottom: 0 };
  const bandLabels: Record<
    "top" | "bottom",
    {
      index: number;
      x: number;
      lines: string[];
      row: number;

      offset: number;
      point: [number, number];
    }[]
  > = { top: [], bottom: [] };
  for (const side of ["top", "bottom"] as const) {
    const rows: { end: number; height: number }[] = [];
    const placed = sided
      .filter((pointer) => pointer.side === side)
      .map(({ label, point, index }) => ({
        index,
        lines: wrap(label, BAND_TEXT_WIDTH),
        x: left + (point[0] / 100) * imageWidth,
        point,
      }))
      .sort((a, b) => a.x - b.x || a.index - b.index);
    for (const label of placed) {
      const width =
        Math.max(...label.lines.map((line) => line.length)) * CHARACTER_WIDTH;
      const start = clamp(
        label.x - width / 2,
        EDGE_PAD,
        stageWidth - EDGE_PAD - width,
      );
      let row = rows.findIndex((at) => at.end + LABEL_SPACING * 2 <= start);
      if (row < 0) {
        rows.push({ end: 0, height: 0 });
        row = rows.length - 1;
      }
      const at = rows[row] as { end: number; height: number };
      at.end = start + width;
      at.height = Math.max(at.height, label.lines.length * LINE_HEIGHT);
      bandLabels[side].push({
        index: label.index,
        x: start + width / 2,
        lines: label.lines,
        row,
        offset: LABEL_GAP,
        point: label.point,
      });
    }
    const offsets = rows.map((_, row) =>
      rows
        .slice(0, row)
        .reduce((sum, at) => sum + at.height + LABEL_SPACING, LABEL_GAP),
    );
    bands[side] = rows.length
      ? (offsets.at(-1) ?? 0) + (rows.at(-1)?.height ?? 0) + EDGE_PAD
      : 0;
    for (const label of bandLabels[side]) {
      label.offset = offsets[label.row] ?? LABEL_GAP;
    }
  }

  const top = bands.top;
  let height = top + imageHeight + bands.bottom;

  for (const side of ["top", "bottom"] as const) {
    for (const label of bandLabels[side]) {
      const { offset } = label;
      const textHeight = label.lines.length * LINE_HEIGHT;
      const x = left + (label.point[0] / 100) * imageWidth;
      const y = top + (label.point[1] / 100) * imageHeight;
      const textTop =
        side === "top" ? top - offset - textHeight : top + imageHeight + offset;
      const end =
        side === "top"
          ? top - offset + (LABEL_GAP - LINE_REACH)
          : top + imageHeight + offset - (LABEL_GAP - LINE_REACH);
      labels.push({
        index: label.index,
        side,
        lines: label.lines,
        x: round(label.x),
        top: round(textTop),
        point: [round(x), round(y)],
        path: `M${round(x)} ${round(y)}V${round(end)}`,
      });
    }
  }

  // Beside: in the margins, in order, never overlapping.
  const textWidth = POINTER_GUTTER - LABEL_GAP - EDGE_PAD;
  for (const side of ["left", "right"] as const) {
    const placed = sided
      .filter((pointer) => pointer.side === side)
      .map(({ label: text, point: at, index }) => {
        const point: [number, number] = [
          left + (at[0] / 100) * imageWidth,
          top + (at[1] / 100) * imageHeight,
        ];
        const lines = wrap(text, textWidth);
        return { index, point, lines, height: lines.length * LINE_HEIGHT };
      })
      .sort((a, b) => a.point[1] - b.point[1] || a.index - b.index);

    let bottom = 0;
    for (const label of placed) {
      const labelTop = Math.max(label.point[1] - label.height / 2, bottom);
      bottom = labelTop + label.height + LABEL_SPACING;
      height = Math.max(height, labelTop + label.height);
      const middle = labelTop + label.height / 2;
      const edge =
        side === "left" ? left - LINE_REACH : left + imageWidth + LINE_REACH;
      const bend = side === "left" ? edge + BEND : edge - BEND;
      const [x, y] = label.point;
      const path =
        Math.abs(middle - y) < 0.5
          ? `M${round(x)} ${round(y)}H${round(edge)}`
          : `M${round(x)} ${round(y)}H${round(bend)}L${round(edge)} ${round(middle)}`;
      labels.push({
        index: label.index,
        side,
        lines: label.lines,
        x: side === "left" ? left - LABEL_GAP : left + imageWidth + LABEL_GAP,
        top: round(labelTop),
        point: [round(x), round(y)],
        path,
      });
    }
  }

  return {
    width: round(stageWidth),
    height: round(height),
    image: {
      left,
      top: round(top),
      width: round(imageWidth),
      height: round(imageHeight),
    },
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    labels: labels.sort((a, b) => a.index - b.index),
  };
}

const ANCHORS = {
  left: "end",
  right: "start",
  top: "middle",
  bottom: "middle",
} as const;

/**
 * The pointers' drawing for an image shown `imageWidth` pixels wide: the
 * stage's margins as an inline style, and the SVG of lines, tips and labels
 * over the stage, drawn at one pixel a unit. The SVG keeps what it was drawn
 * from, so the page can draw it again for the width it shows the image at.
 * Null without a pointer or a known ratio.
 */
export function pointerDrawing(
  pointers: readonly PlacedPointer[],
  ratio: number,
  imageWidth = ANNOTATION_IMAGE_WIDTH,
): { stageStyle: string; drawing: string } | null {
  const layout = layoutPointers(pointers, ratio, imageWidth);
  if (!layout) return null;
  const source = escapeHtml(
    JSON.stringify(
      pointers.map(({ index, point, label, side }) => [
        index,
        point[0],
        point[1],
        side,
        label,
      ]),
    ),
  );
  const drawing = `<svg data-annot-drawing="" data-pointers="${source}" data-ratio="${Number(ratio.toFixed(4))}" data-width="${layout.image.width}" viewBox="0 0 ${layout.width} ${layout.height}" aria-hidden="true">${layout.labels
    .map((label) => {
      const [x, y] = label.point;
      return `<g data-index="${label.index}"><path data-annot-line="" d="${label.path}"></path><path data-annot-tip="" d="M${x} ${round(y - TIP)}L${round(x + TIP)} ${y}L${x} ${round(y + TIP)}L${round(x - TIP)} ${y}Z"></path><text x="${label.x}" y="${round(label.top + layout.lineHeight / 2)}" text-anchor="${ANCHORS[label.side]}" font-size="${layout.fontSize}">${label.lines
        .map(
          (line, at) =>
            `<tspan x="${label.x}" dy="${at ? layout.lineHeight : 0}">${escapeHtml(line)}</tspan>`,
        )
        .join("")}</text></g>`;
    })
    .join("")}</svg>`;
  const { image } = layout;
  return {
    stageStyle: `--annot-left: ${image.left}px; --annot-right: ${round(layout.width - image.left - image.width)}px; --annot-top: ${image.top}px; --annot-bottom: ${round(layout.height - image.top - image.height)}px`,
    drawing,
  };
}

/** The pointers a drawing was drawn from (`pointerDrawing`), read back. */
export function drawingPointers(
  value: string | null | undefined,
): PlacedPointer[] {
  try {
    const list: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(list)) return [];
    return list.flatMap((item) => {
      if (!Array.isArray(item)) return [];
      const [index, x, y, side, label] = item;
      const annotation = readAnnotation({
        kind: "pointer",
        point: `${x} ${y}`,
        label: String(label ?? ""),
        side: String(side ?? ""),
      });
      return Number.isInteger(index) && annotation?.kind === "pointer"
        ? [
            {
              index: Number(index),
              point: annotation.point,
              label: annotation.label,
              side: annotation.side,
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}

/**
 * An arrow or a line as the page draws it: a box from its first point,
 * as long as the line and turned to it, so its thickness and an arrow's head
 * keep their size in pixels whatever the image's width
 * (article-annotations.css). The length is a
 * share of the image's width and the angle the one on screen, both from the
 * image's width-to-height `ratio`.
 */
function shapeStyle(line: AnnotationLine, ratio: number): string {
  const [x1, y1, x2, y2] = line;
  const dx = x2 - x1;
  const dy = (y2 - y1) / ratio;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return `left: ${x1}%; top: ${y1}%; width: ${round(Math.hypot(dx, dy))}%; --angle: ${round(angle)}deg`;
}

export type AnnotationMarkup = {
  /** The stage's inline style: its margins, in pixels. */
  stageStyle: string | null;

  overlay: string;

  drawing: string;

  list: string;
  /** Pointers that have no drawing (no known ratio) and show as markers. */
  hasPointerMarkersOnly: boolean;
};

/**
 * The published markup of an image's annotations, shared by browser and server renderers. `id` names the spotlights'
 * mask and must be unique on the page; `imageWidth` is the width in pixels
 * the image is shown at, or publish's guess at it.
 */
export function annotationMarkup(
  annotations: readonly Annotation[],
  ratio: number,
  { id, imageWidth }: { id: string; imageWidth?: number },
): AnnotationMarkup {
  const pointers = placedPointers(annotations);
  const drawn = pointerDrawing(pointers, ratio, imageWidth);
  const numbersByIndex = annotationNumbers(annotations);
  const boxes = (kind: "area" | "spotlight") =>
    annotations.flatMap((annotation, index) =>
      annotation.kind === kind
        ? [{ box: annotation.box, annotation, index }]
        : [],
    );
  const overlay: string[] = [];
  const spotlights = boxes("spotlight");

  // In CSS pixels, so a spotlight's corners round as an area's do at any size.
  // The shade's box takes the image's own corners (article-annotations.css).
  if (spotlights.length) {
    overlay.push(
      `<span data-annot-shade="" aria-hidden="true"><svg><defs><mask id="${escapeHtml(id)}"><rect width="100%" height="100%" fill="white"></rect>${spotlights
        .map(
          ({ box }) =>
            `<rect x="${box[0]}%" y="${box[1]}%" width="${box[2]}%" height="${box[3]}%" rx="6" fill="black"></rect>`,
        )
        .join(
          "",
        )}</mask></defs><rect width="100%" height="100%" mask="url(#${escapeHtml(id)})"></rect></svg></span>`,
    );
  }

  for (const { annotation, index, box } of [...spotlights, ...boxes("area")]) {
    const [left, top, width, height] = box;
    const label = annotation.kind === "area" ? annotation.label : "";
    const tag = label
      ? `<span data-annot-tag=""${top < 8 ? ' data-below=""' : ""}${left + width > 85 ? ' data-end=""' : ""}>${escapeHtml(label)}</span>`
      : "";
    overlay.push(
      `<span data-annot-${annotation.kind}="" data-index="${index}" style="left: ${left}%; top: ${top}%; width: ${width}%; height: ${height}%">${tag}</span>`,
    );
  }

  const shapeRatio = ratio > 0 && Number.isFinite(ratio) ? ratio : 16 / 10;
  annotations.forEach((annotation, index) => {
    if (annotation.kind !== "arrow" && annotation.kind !== "line") return;
    overlay.push(
      `<span data-annot-shape="${annotation.kind}" data-index="${index}" data-line="${formatAnnotationNumbers(annotation.line)}" style="${shapeStyle(annotation.line, shapeRatio)}" aria-hidden="true"></span>`,
    );
  });

  annotations.forEach((annotation, index) => {
    const number = numbersByIndex.get(index);
    if (
      (annotation.kind !== "marker" && annotation.kind !== "pointer") ||
      number === undefined
    )
      return;
    overlay.push(
      `<span data-annot-marker=""${annotation.kind === "pointer" ? ` data-pointer=""${annotation.side !== "auto" ? ` data-side="${annotation.side}"` : ""}` : ""} data-index="${index}" style="left: ${annotation.point[0]}%; top: ${annotation.point[1]}%" aria-hidden="true">${number}</span>`,
    );
  });

  // A marker with no text keeps its number on the image and no row.
  const listed = [...numbersByIndex.entries()]
    .sort((a, b) => a[1] - b[1])
    .filter(([index]) => {
      const annotation = annotations[index];
      return (
        annotation?.kind !== "marker" ||
        markerPlainText(annotation.text).trim() !== ""
      );
    });
  const list = listed.length
    ? `<ol data-annot-list="">${listed
        .map(([index, number]) => {
          const annotation = annotations[index];
          if (annotation?.kind === "marker") {
            return `<li data-index="${index}" value="${number}"><span data-annot-text="">${annotation.text}</span></li>`;
          }
          if (annotation?.kind === "pointer") {
            return `<li data-index="${index}" data-pointer="" value="${number}"><span data-annot-text="">${escapeHtml(annotation.label)}</span></li>`;
          }
          return "";
        })
        .join("")}</ol>`
    : "";

  return {
    stageStyle: drawn?.stageStyle ?? null,
    overlay: overlay.join(""),
    drawing: drawn?.drawing ?? "",
    list,
    hasPointerMarkersOnly: !drawn && pointers.length > 0,
  };
}
