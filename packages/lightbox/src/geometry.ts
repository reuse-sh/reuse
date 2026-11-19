export interface Point {
  x: number;
  y: number;
}

export interface Zoom extends Point {
  scale: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect extends Size {
  left: number;
  top: number;
}

export const identity: Zoom = { scale: 1, x: 0, y: 0 };

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function contain(image: Size, viewport: Size, padding = 32): Size {
  const width = Math.max(1, viewport.width - padding * 2);
  const height = Math.max(1, viewport.height - padding * 2);
  const scale = Math.min(width / image.width, height / image.height, 1);
  return { width: image.width * scale, height: image.height * scale };
}

export function widthFit(image: Size, viewport: Size, padding = 32): Size {
  const width = Math.max(1, viewport.width - padding * 2);
  const scale = Math.min(width / image.width, 1);
  return { width: image.width * scale, height: image.height * scale };
}

export type Shape = "tall" | "wide" | "regular";

export function shapeOf(image: Size, viewport: Size, padding = 32): Shape {
  if (
    image.height > 2 * image.width &&
    widthFit(image, viewport, padding).height > 2 * viewport.height
  )
    return "tall";
  return image.width > 3 * image.height ? "wide" : "regular";
}

export function zoomAround(from: Zoom, scale: number, focus: Point): Zoom {
  const ratio = scale / from.scale;
  return {
    scale,
    x: focus.x - ratio * (focus.x - from.x),
    y: focus.y - ratio * (focus.y - from.y),
  };
}

/** Where the photo pans: the area's size and how far its center sits from the photo's resting center. */
export interface Area extends Size {
  x?: number;
  y?: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface PanRange {
  x: Range;
  y: Range;
}

function axisRange(content: number, area: number, offset = 0): Range {
  const over = (content - area) / 2;
  if (over >= 0) return { min: offset - over, max: offset + over };
  const at = clamp(0, offset + over, offset - over);
  return { min: at, max: at };
}

export function panRange(scale: number, content: Size, area: Area): PanRange {
  return {
    x: axisRange(content.width * scale, area.width, area.x),
    y: axisRange(content.height * scale, area.height, area.y),
  };
}

export function boundZoom(zoom: Zoom, content: Size, area: Area): Zoom {
  const range = panRange(zoom.scale, content, area);
  return {
    scale: zoom.scale,
    x: clamp(zoom.x, range.x.min, range.x.max) || 0,
    y: clamp(zoom.y, range.y.min, range.y.max) || 0,
  };
}

export const RUBBER = 0.35;

export function rubber(value: number, range: Range) {
  if (value > range.max) return range.max + (value - range.max) * RUBBER;
  if (value < range.min) return range.min - (range.min - value) * RUBBER;
  return value;
}

export function unrubber(value: number, range: Range) {
  if (value > range.max) return range.max + (value - range.max) / RUBBER;
  if (value < range.min) return range.min - (range.min - value) / RUBBER;
  return value;
}

export function elasticZoom(zoom: Zoom, content: Size, area: Area): Zoom {
  const range = panRange(zoom.scale, content, area);
  return {
    scale: zoom.scale,
    x: rubber(zoom.x, range.x),
    y: rubber(zoom.y, range.y),
  };
}

export interface ZoomLimits {
  min: number;
  max: number;
  tap: number;
}

export function zoomLimits({
  fileWidth,
  image,
  viewport,
  zoomed = viewport,
  padding,
  svg,
  maxZoom,
  tapZoom,
}: {
  fileWidth: number | undefined;
  image: Size;
  viewport: Size;
  zoomed?: Size;
  padding: number;
  svg: boolean;
  maxZoom: number | undefined;
  tapZoom: number;
}): ZoomLimits {
  const factor = (fallback: number) =>
    maxZoom !== undefined && Number.isFinite(maxZoom) && maxZoom > 0
      ? maxZoom
      : fallback;
  const shape = shapeOf(image, viewport, padding);
  const whole = contain(image, viewport, padding);
  const fitted = shape === "tall" ? widthFit(image, viewport, padding) : whole;
  const min = shape === "tall" ? whole.width / fitted.width : 1;
  const preferred = (max: number, fallback: number) =>
    shape === "tall"
      ? min
      : shape === "wide"
        ? clamp(zoomed.height / fitted.height, 1, max)
        : clamp(fallback, 1, max);
  const tap = Number.isFinite(tapZoom) ? tapZoom : 1;
  if (svg) {
    const max = Math.max(1, factor(4));
    return { min, max, tap: preferred(max, tap) };
  }
  const natural = fileWidth ? fileWidth / fitted.width : 0;
  if (natural <= 1 + 1e-3) return { min, max: 1, tap: preferred(1, 1) };
  const max = Math.max(1, natural * factor(1));
  return { min, max, tap: preferred(max, Math.max(tap, natural)) };
}

export function cover(
  image: Size,
  frame: Size,
  position: Point = { x: 0.5, y: 0.5 },
): Rect {
  const scale = Math.max(
    frame.width / image.width,
    frame.height / image.height,
  );
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    width,
    height,
    left: (frame.width - width) * position.x,
    top: (frame.height - height) * position.y,
  };
}
