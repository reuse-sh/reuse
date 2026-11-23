import type { FloatingTooltipSide } from "./tooltip.js";

type Point = { x: number; y: number };
type Size = { width: number; height: number };

export function clampTooltipPosition(
  { x, y }: Point,
  { width, height }: Size,
  viewport: Size,
  padding: number,
) {
  return {
    x: Math.min(
      Math.max(padding, x),
      Math.max(padding, viewport.width - width - padding),
    ),
    y: Math.min(
      Math.max(padding, y),
      Math.max(padding, viewport.height - height - padding),
    ),
  };
}

export function positionFloatingTooltip({
  reference,
  size,
  viewport,
  side = "bottom-right",
  offset = 10,
  padding = 12,
}: {
  reference: Point;
  size: Size;
  viewport: Size;
  side?: FloatingTooltipSide;
  offset?: number;
  padding?: number;
}) {
  const { width, height } = size;
  const dx =
    side === "left" || side.endsWith("-left")
      ? -width - offset
      : side === "right" || side.endsWith("-right")
        ? offset
        : -width / 2;
  const dy = side.startsWith("top")
    ? -height - offset
    : side.startsWith("bottom")
      ? offset
      : -height / 2;
  return clampTooltipPosition(
    { x: reference.x + dx, y: reference.y + dy },
    size,
    viewport,
    padding,
  );
}
