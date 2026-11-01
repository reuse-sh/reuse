/**
 * The figures the dots take turns on, as geometry only.
 *
 * A figure places dot `i` at a phase: `k` whole moves done, `e` the eased
 * progress through the next one, `lin` the two together for figures that flow
 * rather than step. It returns `[x, y, z, scale]` inside the unit circle, with
 * `z` in `[-1, 1]` and `+1` nearest the viewer. How long a move takes is the
 * config's business, not the figure's.
 *
 * Adding a figure is one entry here and one line in `config.ts`.
 */

export type Point = [x: number, y: number, z: number, scale: number];

export interface Phase {
  k: number;
  e: number;
  lin: number;
}

export interface Figure {
  dots: 3 | 4;
  at: (i: number, phase: Phase) => Point;
}

const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
export const frac = (x: number) => x - Math.floor(x);
const wave = (x: number) => 0.5 + 0.5 * Math.sin(x);
export const easeInOutCubic = (x: number) =>
  x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;

type Pair = [number, number];

const SQUARE: Pair[] = [
  [-0.72, -0.72],
  [0.72, -0.72],
  [0.72, 0.72],
  [-0.72, 0.72],
];
const TRIANGLE: Pair[] = [0, 1, 2].map((k) => [
  Math.cos(-Math.PI / 2 + (k * TAU) / 3),
  Math.sin(-Math.PI / 2 + (k * TAU) / 3),
]);
const TETRAHEDRON: [number, number, number][] = [
  [0.62, 0.62, 0.62],
  [0.62, -0.62, -0.62],
  [-0.62, 0.62, -0.62],
  [-0.62, -0.62, 0.62],
];

const ACROSS = [1, 0, 3, 2];
const UP_DOWN = [3, 2, 1, 0];

const corner = (points: Pair[], index: number): Pair =>
  points[mod(index, points.length)] as Pair;

function along(points: Pair[], index: number): Point {
  const [ax, ay] = corner(points, Math.floor(index));
  const [bx, by] = corner(points, Math.floor(index) + 1);
  const f = frac(index);

  return [ax + (bx - ax) * f, ay + (by - ay) * f, 0, 1];
}

function rotate(
  [x, y, z]: [number, number, number],
  ax: number,
  ay: number,
  az = 0,
): [number, number, number] {
  const y1 = y * Math.cos(ax) - z * Math.sin(ax);
  const z1 = y * Math.sin(ax) + z * Math.cos(ax);
  const x2 = x * Math.cos(ay) + z1 * Math.sin(ay);
  const z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);

  return [
    x2 * Math.cos(az) - y1 * Math.sin(az),
    x2 * Math.sin(az) + y1 * Math.cos(az),
    z2,
  ];
}

/** A dot crossing from A to B, bowing aside and passing in front (side 1) or behind (side -1). */
export function cross(
  [ax, ay, az = 0]: readonly number[],
  [bx, by, bz = 0]: readonly number[],
  e: number,
  side: number,
  bow: number,
): Point {
  const dx = (bx ?? 0) - (ax ?? 0);
  const dy = (by ?? 0) - (ay ?? 0);
  const len = Math.hypot(dx, dy) || 1;
  const lift = Math.sin(Math.PI * e);
  const b = bow * lift * side;

  return [
    (ax ?? 0) + dx * e - (dy / len) * b,
    (ay ?? 0) + dy * e + (dx / len) * b,
    az + (bz - az) * e + side * lift,
    1,
  ];
}

export const FIGURES = {
  "triangle-turn": {
    dots: 3,
    at: (i, { k, e }) => {
      const a = -Math.PI / 2 + ((i + k + e) * TAU) / 3;
      return [Math.cos(a), Math.sin(a), 0, 1];
    },
  },
  "triangle-edges": {
    dots: 3,
    at: (i, { k, e }) => along(TRIANGLE, i + k + e),
  },
  "triangle-tumble": {
    dots: 3,
    at: (i, { k, e }) => {
      const a = -Math.PI / 2 + (i * TAU) / 3 + ((k + e) * Math.PI) / 3;
      const flip = (k + e) * Math.PI;
      return [
        Math.cos(a),
        Math.sin(a) * Math.cos(flip),
        Math.sin(a) * Math.sin(flip),
        1,
      ];
    },
  },
  "square-turn": {
    dots: 4,
    at: (i, { k, e }) => {
      const a = (-3 * Math.PI) / 4 + ((i + k + e) * Math.PI) / 2;
      return [Math.cos(a), Math.sin(a), 0, 1];
    },
  },
  "square-edges": { dots: 4, at: (i, { k, e }) => along(SQUARE, i + k + e) },
  "square-cross": {
    dots: 4,
    at: (i, { k, e }) => {
      // Corners 0-2 swap on even moves, 1-3 on odd ones; a dot never leaves
      // its diagonal.
      const onFirst = i % 2 === 0;
      const done = onFirst ? Math.ceil(k / 2) : Math.floor(k / 2);
      const c = mod(i + 2 * done, 4);
      const from = corner(SQUARE, c);

      if ((k % 2 === 0) !== onFirst) {
        return [from[0], from[1], 0, 1];
      }

      return cross(from, corner(SQUARE, c + 2), e, c < 2 ? 1 : -1, 0.3);
    },
  },
  "square-shuffle": {
    dots: 4,
    at: (i, { k, e }) => {
      // Neighbours trade places across, then up and down, passing in front of
      // each other. Two moves together shift every dot two corners on.
      let c = mod(i + 2 * Math.floor(k / 2), 4);

      if (k % 2 === 1) {
        c = ACROSS[c] ?? c;
      }

      const to = (k % 2 === 0 ? ACROSS[c] : UP_DOWN[c]) ?? c;
      const a = corner(SQUARE, c);
      const b = corner(SQUARE, to);
      const forward = k % 2 === 0 ? b[0] > a[0] : b[1] > a[1];

      return cross(a, b, e, forward ? 1 : -1, 0.22);
    },
  },
  "square-flip": {
    dots: 4,
    at: (i, { lin }) => {
      // Turns about its diagonal, so it shows its edge and comes back mirrored.
      const a = (lin * Math.PI) / 2;
      const [x, y] = corner(SQUARE, i);
      const u = (x + y) / Math.SQRT2;
      const v = (x - y) / Math.SQRT2;
      const vx = v * Math.cos(a);
      const [px, py, pz] = rotate(
        [(u + vx) / Math.SQRT2, (u - vx) / Math.SQRT2, v * Math.sin(a)],
        0,
        0,
        lin * 0.25,
      );
      return [px, py, pz, 1];
    },
  },
  "tetrahedron-tumble": {
    dots: 4,
    at: (i, { lin }) => {
      const vertex = TETRAHEDRON[i] ?? [0, 0, 0];
      const [x, y, z] = rotate(vertex, 0.45 + lin * 0.54, (lin * Math.PI) / 2);
      return [x * 1.15, y * 1.15, z * 1.4, 1];
    },
  },
  "circle-flow": {
    dots: 4,
    at: (i, { lin }) => {
      const a = -Math.PI / 2 + ((i + lin) * TAU) / 4;
      return [Math.cos(a), Math.sin(a), 0, 1];
    },
  },
  "circle-chase": {
    dots: 3,
    at: (i, { lin }) => {
      const a =
        -Math.PI / 2 + TAU * easeInOutCubic(frac(lin * 0.5 + 0.5 - i * 0.14));
      return [Math.cos(a), Math.sin(a), 0, 1];
    },
  },
  "tilted-orbit": {
    dots: 3,
    at: (i, { lin }) => {
      const th = (i * TAU) / 3 + (lin * TAU) / 3;
      const w = th - 0.38 * Math.cos(th);
      return [Math.cos(w) * 1.05, Math.sin(w) * 0.42, Math.sin(w), 1];
    },
  },
  spiral: {
    dots: 3,
    at: (i, { lin }) => {
      const turn = lin * 0.9 + (i * TAU) / 3;
      const breath = lin * 1.4 + i * 2.1;
      const r = 0.3 + 0.7 * wave(breath);
      return [
        Math.cos(turn) * r,
        Math.sin(turn) * r * 0.9,
        Math.cos(breath) * 0.7,
        1,
      ];
    },
  },
  "figure-eight": {
    dots: 3,
    at: (i, { lin }) => {
      const th = (i * TAU) / 3 + (lin * TAU) / 3;
      const d = 1 + Math.sin(th) ** 2;
      return [
        (1.25 * Math.cos(th)) / d,
        (1.25 * Math.sin(th) * Math.cos(th)) / d,
        0.8 * Math.sin(th),
        1,
      ];
    },
  },
  "row-hop": {
    dots: 3,
    at: (i, { k, e }) => {
      const slot = mod(i - k, 3);
      const lift = Math.sin(Math.PI * e);

      if (slot === 0) {
        return [-1 + 2 * e, -0.75 * lift, 0.4 * lift, 1 - 0.35 * lift];
      }

      return [slot - 1 - e, 0, 0, 1];
    },
  },
  "row-swell": {
    dots: 3,
    at: (i, { lin }) => [
      (i - 1) * 0.72,
      0,
      0,
      0.55 + 0.55 * wave(lin * TAU - i * 1.2),
    ],
  },
} satisfies Record<string, Figure>;

export type FigureName = keyof typeof FIGURES;
