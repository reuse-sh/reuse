export interface StagePoint {
  x: number;
  y: number;
}

/** CSS cubic-bezier(x1, y1, x2, y2) as a function of progress. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (progress: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return 1;
    let t = progress;
    for (let i = 0; i < 6; i++) {
      const error = sampleX(t) - progress;
      const slope = slopeX(t);
      if (Math.abs(error) < 1e-6) return sampleY(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    let low = 0;
    let high = 1;
    t = progress;
    for (let i = 0; i < 30; i++) {
      const x = sampleX(t);
      if (Math.abs(x - progress) < 1e-6) break;
      if (x < progress) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return sampleY(t);
  };
}

/** Quick to leave, slow to land, like a hand that aims. */
export const moveEasing = cubicBezier(0.3, 0.1, 0.15, 1);

/** How long a move takes: longer for a longer reach, never instant, never slow. */
export function moveDuration(distance: number) {
  if (distance < 1) return 0;
  return Math.round(Math.min(900, 240 + 30 * Math.sqrt(distance)));
}

/**
 * A shallow arc from one point to another. It bows downward, the way a
 * wrist swings, by a little more than a tenth of the distance.
 */
export function arc(from: StagePoint, to: StagePoint) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  let nx = distance ? -dy / distance : 0;
  let ny = distance ? dx / distance : 0;
  if (ny < 0 || (ny === 0 && nx < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const bow = Math.min(distance * 0.12, 36);
  const control = {
    x: (from.x + to.x) / 2 + nx * bow,
    y: (from.y + to.y) / 2 + ny * bow,
  };
  return (t: number): StagePoint => {
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    };
  };
}
