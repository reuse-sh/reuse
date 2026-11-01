export const EASINGS = [
  "ease-in-out-sine",
  "ease-in",
  "ease-out",
  "linear",
] as const;

export type EasingName = (typeof EASINGS)[number];
export type CubicBezier = readonly [number, number, number, number];
export type Easing = EasingName | CubicBezier;

export interface EasingStop {
  position: number;
  progress: number;
}

export interface EasingGradientOptions {
  from?: string;
  to: string;
  easing?: Easing;
  direction?: string;
  stops?: number;
  type?: "linear" | "radial";
}

const EPSILON = 1e-7;

function cubicBezier([x1, y1, x2, y2]: CubicBezier): (x: number) => number {
  if (![x1, y1, x2, y2].every(Number.isFinite))
    throw new RangeError("Cubic bezier values must be finite numbers.");
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1)
    throw new RangeError("Cubic bezier x values must be between 0 and 1.");
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x;
      if (Math.abs(error) < EPSILON) return sampleY(t);
      const slope = slopeX(t);
      if (Math.abs(slope) < EPSILON) break;
      t -= error / slope;
      if (t < 0 || t > 1) break;
    }
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > EPSILON) {
      if (sampleX(t) < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sampleY(t);
  };
}

const named: Record<EasingName, (t: number) => number> = {
  "ease-in-out-sine": (t) => 0.5 - Math.cos(Math.PI * t) / 2,
  "ease-in": cubicBezier([0.42, 0, 1, 1]),
  "ease-out": cubicBezier([0, 0, 0.58, 1]),
  linear: (t) => t,
};

function resolve(easing: Easing): (t: number) => number {
  if (typeof easing !== "string") return cubicBezier(easing);
  const curve = named[easing];
  if (!curve) throw new RangeError(`Unknown easing: ${easing}.`);
  return curve;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const round = (value: number) => Math.round(value * 1e4) / 1e4;

export function easingStops(
  easing: Easing = "ease-in-out-sine",
  stops = 12,
): EasingStop[] {
  const curve = resolve(easing);
  if (!Number.isInteger(stops) || stops < 2)
    throw new RangeError("Stops must be an integer of at least 2.");
  const count = easing === "linear" ? 2 : stops;
  return Array.from({ length: count }, (_, index) => {
    const position = index / (count - 1);
    return { position, progress: round(clamp(curve(position))) };
  });
}

function mix(from: string, to: string, progress: number): string {
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  return `color-mix(in oklab, ${to} ${round(progress * 100)}%, ${from})`;
}

export function easingGradient({
  from = "transparent",
  to,
  easing = "ease-in-out-sine",
  direction,
  stops = 12,
  type = "linear",
}: EasingGradientOptions): string {
  const colors = easingStops(easing, stops).map(
    ({ position, progress }) =>
      `${mix(from, to, progress)} ${round(position * 100)}%`,
  );
  const prelude = direction ?? (type === "linear" ? "to bottom" : undefined);
  const parts = prelude ? [prelude, ...colors] : colors;
  return `${type}-gradient(${parts.join(", ")})`;
}
