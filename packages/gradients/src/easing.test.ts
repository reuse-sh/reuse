import { describe, expect, it } from "vitest";
import { EASINGS, easingGradient, easingStops } from "./index.js";

describe("easingGradient", () => {
  it("builds a linear gradient for a known input", () => {
    expect(
      easingGradient({ from: "transparent", to: "black", easing: "linear" }),
    ).toBe("linear-gradient(to bottom, transparent 0%, black 100%)");
  });

  it("mixes sampled stops with color-mix so a transparent end keeps its hue", () => {
    expect(
      easingGradient({
        to: "rgb(255 0 0)",
        stops: 3,
        direction: "to right",
      }),
    ).toBe(
      "linear-gradient(to right, transparent 0%, color-mix(in oklab, rgb(255 0 0) 50%, transparent) 50%, rgb(255 0 0) 100%)",
    );
  });

  it("leaves the prelude out of a radial gradient without a direction", () => {
    expect(
      easingGradient({ to: "white", easing: "linear", type: "radial" }),
    ).toBe("radial-gradient(transparent 0%, white 100%)");
  });

  it("rejects too few stops and an invalid bezier", () => {
    expect(() => easingGradient({ to: "black", stops: 1 })).toThrow(RangeError);
    expect(() =>
      easingGradient({ to: "black", easing: [1.5, 0, 1, 1] }),
    ).toThrow(RangeError);
    expect(() =>
      easingGradient({ to: "black", easing: "bounce" as never }),
    ).toThrow(RangeError);
  });
});

describe("easingStops", () => {
  it.each([...EASINGS, [0.23, 1, 0.32, 1] as const])(
    "%s rises from 0 to 1 without stepping back",
    (easing) => {
      const stops = easingStops(easing, 24);
      expect(stops[0]).toEqual({ position: 0, progress: 0 });
      expect(stops.at(-1)).toEqual({ position: 1, progress: 1 });
      for (let i = 1; i < stops.length; i++)
        expect(stops[i].progress).toBeGreaterThanOrEqual(stops[i - 1].progress);
    },
  );

  it("solves the CSS ease-in curve at its midpoint", () => {
    expect(easingStops("ease-in", 3)[1].progress).toBeCloseTo(0.3153, 3);
  });

  it("clamps a bezier that overshoots", () => {
    const stops = easingStops([0.5, -0.8, 0.5, 1.8], 12);
    for (const { progress } of stops) {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });
});
