import type { ThinkingDotsConfig, Timing } from "./config.js";
import {
  cross,
  easeInOutCubic,
  FIGURES,
  type Figure,
  type FigureName,
  frac,
  type Phase,
  type Point,
} from "./figures.js";

/**
 * Time to pixels. Every dot's position is a pure function of time, so a comet
 * tail is the same dot sampled a little earlier, and nothing is integrated
 * frame to frame.
 */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

interface ResolvedFigure {
  name: FigureName;
  figure: Figure;
  timing: Timing;
  /** Seconds on screen, in figure time. Stepped figures end on a whole move. */
  run: number;
  /** Where the run ends, so the switch starts from where the dots really are. */
  moves: number;
}

interface Block {
  current: ResolvedFigure;
  next: ResolvedFigure;
  start: number;
  run: number;
  end: number;
}

export interface Timeline {
  config: ThinkingDotsConfig;
  figures: ResolvedFigure[];

  dots: number;
  seed: number;
  blocks: Block[];
}

function resolve(config: ThinkingDotsConfig): ResolvedFigure[] {
  const onScreen = config.figureSeconds * config.speed;

  return config.figures.map(({ name, timing }) => {
    const figure: Figure = FIGURES[name];

    if (timing.mode === "linear") {
      return { name, figure, timing, run: onScreen, moves: 0 };
    }

    const period = timing.step + timing.rest;
    const moves = Math.max(1, Math.round(onScreen / period));

    return { name, figure, timing, run: moves * period, moves };
  });
}

export function createTimeline(
  config: ThinkingDotsConfig,
  seed: number,
): Timeline {
  const figures = resolve(config);

  if (figures.length === 0) {
    throw new Error("A thinking dots config needs at least one figure.");
  }

  return {
    config,
    figures,
    dots: Math.max(...figures.map((f) => f.figure.dots)),
    seed,
    blocks: [],
  };
}

const hash = (n: number) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

/** The figures in shuffled rounds, so every one comes up before any repeats, and never twice running. */
function figureAt(timeline: Timeline, block: number): ResolvedFigure {
  const { figures, seed } = timeline;
  const n = figures.length;
  const round = (r: number) => {
    const bag = [...figures];

    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(hash(seed * 31.7 + r * 13.7 + i * 1.3) * (i + 1));
      [bag[i], bag[j]] = [bag[j] as ResolvedFigure, bag[i] as ResolvedFigure];
    }

    return bag;
  };
  const r = Math.floor(block / n);
  const bag = round(r);

  if (n > 1 && bag[0] === round(r - 1)[n - 1]) {
    [bag[0], bag[1]] = [bag[1] as ResolvedFigure, bag[0] as ResolvedFigure];
  }

  return bag[block - r * n] as ResolvedFigure;
}

function blockAt(timeline: Timeline, t: number): Block {
  const { blocks, config } = timeline;

  if (timeline.figures.length === 1) {
    const only = timeline.figures[0] as ResolvedFigure;
    return {
      current: only,
      next: only,
      start: 0,
      run: Infinity,
      end: Infinity,
    };
  }

  const switching =
    config.switchSeconds + config.switchStagger * (timeline.dots - 1);

  for (let last = blocks.at(-1); !last || last.end <= t; last = blocks.at(-1)) {
    const index = blocks.length;
    const current = figureAt(timeline, index);
    const start = last?.end ?? 0;

    blocks.push({
      current,
      next: figureAt(timeline, index + 1),
      start,
      run: current.run,
      end: start + current.run + switching,
    });
  }

  let lo = 0;
  let hi = blocks.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;

    if ((blocks[mid] as Block).end <= t) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return blocks[lo] as Block;
}

function phaseOf(timing: Timing, i: number, local: number): Phase {
  if (timing.mode === "linear") {
    const lin = local * timing.rate;
    return { k: Math.floor(lin), e: frac(lin), lin };
  }

  const period = timing.step + timing.rest;
  const k = Math.floor(local / period);
  const stagger = Math.min(timing.stagger, timing.rest / 2);
  const e = easeInOutCubic(
    clamp01((local - k * period - i * stagger) / timing.step),
  );

  return { k, e, lin: k + e };
}

const at = (f: ResolvedFigure, i: number, phase: Phase) =>
  f.figure.at(i % f.figure.dots, phase);

export interface DotSample {
  point: Point;
  /** False for a dot the current figure does not use: it sits on a neighbour. */
  visible: boolean;
  figure: FigureName;

  next?: FigureName;
}

/** Where dot `i` is at `t` seconds of figure time. */
export function sampleDot(timeline: Timeline, i: number, t: number): DotSample {
  const time = Math.max(0, t);
  const block = blockAt(timeline, time);
  const local = time - block.start;
  const { current, next } = block;

  if (local < block.run) {
    return {
      point: at(current, i, phaseOf(current.timing, i, local)),
      visible: i < current.figure.dots,
      figure: current.name,
    };
  }

  const end =
    current.timing.mode === "linear"
      ? phaseOf(current.timing, i, block.run)
      : { k: current.moves, e: 0, lin: current.moves };
  const from = at(current, i, end);
  const to = at(next, i, { k: 0, e: 0, lin: 0 });
  const { switchSeconds, switchStagger } = timeline.config;
  const e = easeInOutCubic(
    clamp01((local - block.run - i * switchStagger) / switchSeconds),
  );
  // Alternate dots bow to either side and pass in front or behind, so they
  // never travel through each other on the way.
  const side = i % 2 ? 1 : -1;
  const [x, y, lift] = cross(from, to, e, side, 0.3);
  const flatZ = from[2] + (to[2] - from[2]) * e;

  return {
    point: [
      x,
      y,
      flatZ + (lift - flatZ) * 0.6,
      from[3] + (to[3] - from[3]) * e,
    ],
    visible: i < Math.max(current.figure.dots, next.figure.dots),
    figure: current.name,
    next: next.name,
  };
}

/** Paints one frame on a context already scaled to CSS pixels. `seconds` is wall time. */
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  timeline: Timeline,
  seconds: number,
  size: number,
  color: string,
) {
  const { depth, dotSize, speed, trail } = timeline.config;
  const t = seconds * speed;
  const radius = (size / 2 - size * dotSize * (1 + 0.45 * depth) * 1.1) / 1.12;
  const marks: { x: number; y: number; z: number; r: number; a: number }[] = [];

  for (let i = 0; i < timeline.dots; i++) {
    for (let k = trail.count; k >= 0; k--) {
      const sample = sampleDot(timeline, i, t - k * trail.gap);

      if (!sample.visible) {
        continue;
      }

      const [x, y, z, scale] = sample.point;
      const fade = 1 - k / (trail.count + 1);
      const spread = 1 + depth * 0.12 * z;

      marks.push({
        x: size / 2 + x * radius * spread,
        y: size / 2 + y * radius * spread,
        z,
        r:
          size *
          dotSize *
          (1 + depth * 0.45 * z) *
          scale *
          (k ? 0.35 + 0.6 * fade : 1),
        a: (k ? fade * fade * 0.7 : 1) * (1 - depth * 0.35 * (1 - (z + 1) / 2)),
      });
    }
  }

  // Far first, so a dot passing in front covers the one behind it.
  marks.sort((a, b) => a.z - b.z);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = color;

  for (const mark of marks) {
    ctx.globalAlpha = Math.max(0, mark.a);
    ctx.beginPath();
    ctx.arc(mark.x, mark.y, Math.max(0.1, mark.r), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
