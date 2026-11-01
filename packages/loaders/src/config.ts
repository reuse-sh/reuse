import type { FigureName } from "./figures.js";

/**
 * How a figure moves. Stepped: a move, then a pause, each dot setting off
 * `stagger` seconds after the one before (never more than half the pause, so
 * a dot finishes before the next move starts). Linear: `rate` moves a second
 * without stopping.
 */
export type Timing =
  | { mode: "stepped"; step: number; rest: number; stagger: number }
  | { mode: "linear"; rate: number };

export interface ThinkingDotsConfig {
  figures: ReadonlyArray<{ name: FigureName; timing: Timing }>;
  /** Seconds every figure stays on screen, by the clock, before the dots move on. */
  figureSeconds: number;
  /** How long the dots take to travel to the next figure. */
  switchSeconds: number;
  /** Delay between one dot and the next setting off for the next figure. */
  switchStagger: number;

  speed: number;
  /** Comet tail: earlier samples of the same dot, `gap` seconds apart. */
  trail: { count: number; gap: number };
  /** 0 is flat; 1 shrinks and dims the dots furthest back the most. */
  depth: number;

  dotSize: number;
}

const stepped = (step: number, rest: number, stagger = 0.05): Timing => ({
  mode: "stepped",
  step,
  rest,
  stagger,
});
const linear = (rate: number): Timing => ({ mode: "linear", rate });

export const THINKING_DOTS: ThinkingDotsConfig = {
  figures: [
    { name: "triangle-turn", timing: stepped(1, 0.05) },
    { name: "triangle-edges", timing: stepped(1, 0) },
    { name: "triangle-tumble", timing: stepped(0.9, 0) },
    { name: "square-turn", timing: stepped(1, 0, 0.02) },
    { name: "square-edges", timing: stepped(1, 0, 0.02) },
    { name: "square-cross", timing: stepped(1, 0) },
    { name: "square-shuffle", timing: stepped(0.9, 0) },
    { name: "square-flip", timing: linear(2) },
    { name: "tetrahedron-tumble", timing: linear(1.5) },
    { name: "circle-flow", timing: linear(1) },
    { name: "circle-chase", timing: linear(1) },
    { name: "tilted-orbit", timing: linear(0.9) },
    { name: "spiral", timing: linear(1.8) },
    { name: "figure-eight", timing: linear(0.6) },
    { name: "row-hop", timing: stepped(1, 0.05) },
    { name: "row-swell", timing: linear(0.9) },
  ],
  figureSeconds: 5,
  switchSeconds: 0.9,
  switchStagger: 0.05,
  speed: 1.2,
  trail: { count: 8, gap: 0.02 },
  depth: 1,
  dotSize: 0.1,
};
