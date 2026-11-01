import { describe, expect, it } from "vitest";

import { THINKING_DOTS, type ThinkingDotsConfig } from "./config.js";
import { createTimeline, sampleDot } from "./engine.js";

/**
 * The largest change in any visible dot, position and size, between two
 * samples `dt` apart.
 * A jump stays the same size when `dt` shrinks; ordinary speed shrinks with it.
 */
function largestStep(config: ThinkingDotsConfig, seconds: number, dt: number) {
  const timeline = createTimeline(config, 7);
  let largest = 0;

  for (let i = 0; i < timeline.dots; i++) {
    let previous: number[] | null = null;

    for (let t = 0; t < seconds; t += dt) {
      const { point, visible } = sampleDot(timeline, i, t);

      if (!visible) {
        previous = null;
        continue;
      }

      if (previous) {
        largest = Math.max(
          largest,
          Math.hypot(
            point[0] - (previous[0] ?? 0),
            point[1] - (previous[1] ?? 0),
            point[2] - (previous[2] ?? 0),
            point[3] - (previous[3] ?? 0),
          ),
        );
      }

      previous = point;
    }
  }

  return largest;
}

const isContinuous = (config: ThinkingDotsConfig, seconds: number) =>
  largestStep(config, seconds, 1 / 240) /
    largestStep(config, seconds, 1 / 960) >
  3;

describe("thinking dots", () => {
  it.each(THINKING_DOTS.figures.map((figure) => [figure.name, figure]))(
    "%s moves without jumping",
    (_, figure) => {
      expect(isContinuous({ ...THINKING_DOTS, figures: [figure] }, 12)).toBe(
        true,
      );
    },
  );

  it("moves without jumping through every switch between figures", () => {
    expect(isContinuous(THINKING_DOTS, 140)).toBe(true);
  });

  it("keeps every figure on screen for about five seconds of clock time", () => {
    const timeline = createTimeline(THINKING_DOTS, 7);
    sampleDot(timeline, 0, 200);

    const runs = timeline.blocks.map(
      (block) => [block.current.name, block.run] as const,
    );

    expect(runs.length).toBeGreaterThan(THINKING_DOTS.figures.length);
    for (const [, run] of runs) {
      expect(run / THINKING_DOTS.speed).toBeGreaterThanOrEqual(4.5);
      expect(run / THINKING_DOTS.speed).toBeLessThanOrEqual(5.5);
    }
  });

  it("never shows the same figure twice running, and shows every one in each round", () => {
    const timeline = createTimeline(THINKING_DOTS, 3);
    sampleDot(timeline, 0, 600);
    const order = timeline.blocks.map((block) => block.current.name);
    const count = THINKING_DOTS.figures.length;

    for (let i = 1; i < order.length; i++) {
      expect(order[i]).not.toBe(order[i - 1]);
    }
    expect(new Set(order.slice(0, count)).size).toBe(count);
  });
});
