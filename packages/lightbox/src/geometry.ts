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

export function zoomAround(from: Zoom, scale: number, focus: Point): Zoom {
  const ratio = scale / from.scale;
  return {
    scale,
    x: focus.x - ratio * (focus.x - from.x),
    y: focus.y - ratio * (focus.y - from.y),
  };
}

export function panLimits(scale: number, content: Size, viewport: Size): Point {
  return {
    x: Math.max(0, (content.width * scale - viewport.width) / 2),
    y: Math.max(0, (content.height * scale - viewport.height) / 2),
  };
}

export function boundZoom(zoom: Zoom, content: Size, viewport: Size): Zoom {
  const limit = panLimits(zoom.scale, content, viewport);
  return {
    scale: zoom.scale,
    x: clamp(zoom.x, -limit.x, limit.x),
    y: clamp(zoom.y, -limit.y, limit.y),
  };
}

export const RUBBER = 0.35;

export function rubber(value: number, limit: number) {
  const over = Math.abs(value) - limit;
  return over > 0 ? Math.sign(value) * (limit + over * RUBBER) : value;
}

export function unrubber(value: number, limit: number) {
  const over = Math.abs(value) - limit;
  return over > 0 ? Math.sign(value) * (limit + over / RUBBER) : value;
}

export function elasticZoom(zoom: Zoom, content: Size, viewport: Size): Zoom {
  const limit = panLimits(zoom.scale, content, viewport);
  return {
    scale: zoom.scale,
    x: rubber(zoom.x, limit.x),
    y: rubber(zoom.y, limit.y),
  };
}

export interface ZoomLimits {
  max: number;
  tap: number;
}

export function zoomLimits({
  fileWidth,
  fittedWidth,
  svg,
  maxZoom,
  tapZoom,
}: {
  fileWidth: number | undefined;
  fittedWidth: number;
  svg: boolean;
  maxZoom: number | undefined;
  tapZoom: number;
}): ZoomLimits {
  const factor = (fallback: number) =>
    maxZoom !== undefined && Number.isFinite(maxZoom) && maxZoom > 0
      ? maxZoom
      : fallback;
  const tap = Number.isFinite(tapZoom) ? tapZoom : 1;
  if (svg) {
    const max = Math.max(1, factor(4));
    return { max, tap: clamp(tap, 1, max) };
  }
  const natural = fileWidth && fittedWidth > 0 ? fileWidth / fittedWidth : 0;
  if (natural <= 1 + 1e-3) return { max: 1, tap: 1 };
  const max = Math.max(1, natural * factor(1));
  return { max, tap: clamp(Math.max(tap, natural), 1, max) };
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
