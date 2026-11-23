// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createFloatingTooltipMotion,
  positionFloatingTooltip,
} from "./index.js";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it("tracks one axis while snapping the other to an independent anchor", () => {
  const frames: Array<{ x: number; y: number; tilt: number }> = [];
  const motion = createFloatingTooltipMotion(window, (frame) =>
    frames.push(frame),
  );
  motion.setPosition({ x: 20, y: 50 }, { snapX: true, snapY: true });
  motion.setPosition({ x: 120, y: 80 }, { snapY: true, tilt: { max: 5 } });
  expect(frames.at(-1)).toEqual({ x: 20, y: 80, tilt: 0 });

  vi.advanceTimersByTime(32);
  const moving = motion.getFrame();
  expect(moving.x).toBeGreaterThan(20);
  expect(moving.x).toBeLessThan(120);
  expect(moving.y).toBe(80);
  expect(moving.tilt).toBeGreaterThan(0);
  expect(moving.tilt).toBeLessThanOrEqual(5);

  vi.advanceTimersByTime(900);
  expect(frames.at(-1)).toEqual({ x: 120, y: 80, tilt: 0 });
  expect(vi.getTimerCount()).toBe(0);
});

it("releases both scheduled motion and tilt work when its host closes", () => {
  const frames: unknown[] = [];
  const motion = createFloatingTooltipMotion(window, (frame) =>
    frames.push(frame),
  );
  motion.setPosition({ x: 100, y: 80 }, { tilt: { max: 5, direction: -1 } });
  vi.advanceTimersByTime(16);
  expect(motion.getFrame().tilt).toBeLessThan(0);
  const count = frames.length;

  motion.stop();
  vi.advanceTimersByTime(1000);
  expect(frames).toHaveLength(count);
  expect(vi.getTimerCount()).toBe(0);

  motion.setPosition({ x: 12, y: 24 }, { snapX: true, snapY: true });
  expect(frames.at(-1)).toEqual({ x: 12, y: 24, tilt: 0 });
});

it("ignores a sub-pixel movement for tilt and preserves the current angle until it settles", () => {
  const motion = createFloatingTooltipMotion(window, () => {});
  motion.setPosition({ x: 0.2, y: 0 }, { tilt: { max: 5 } });
  vi.advanceTimersByTime(32);
  expect(motion.getFrame().tilt).toBe(0);

  motion.setPosition({ x: 140, y: 0 }, { tilt: { max: 5 } });
  vi.advanceTimersByTime(32);
  const angleOnExit = motion.getFrame().tilt;
  expect(angleOnExit).toBeGreaterThan(0);

  vi.advanceTimersByTime(80);
  expect(motion.getFrame().tilt).toBeGreaterThan(0);
  expect(motion.getFrame().tilt).toBeLessThan(angleOnExit);
  motion.stop();
});

it("places a floating tooltip against an arbitrary point and clamps each edge", () => {
  const size = { width: 100, height: 30 };
  const viewport = { width: 300, height: 250 };
  expect(
    positionFloatingTooltip({
      reference: { x: 140, y: 80 },
      size,
      viewport,
      side: "top",
      offset: 5,
    }),
  ).toEqual({ x: 90, y: 45 });
  expect(
    positionFloatingTooltip({ reference: { x: 290, y: 240 }, size, viewport }),
  ).toEqual({ x: 188, y: 208 });
});
