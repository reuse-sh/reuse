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

export function boundZoom(zoom: Zoom, content: Size, viewport: Size): Zoom {
  const x = Math.max(0, (content.width * zoom.scale - viewport.width) / 2);
  const y = Math.max(0, (content.height * zoom.scale - viewport.height) / 2);
  return {
    scale: zoom.scale,
    x: clamp(zoom.x, -x, x),
    y: clamp(zoom.y, -y, y),
  };
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
