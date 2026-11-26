import { expect, it } from "vitest";
import { createCursorPreviewMotion } from "./preview-motion.js";

function clock() {
  let queued: FrameRequestCallback | undefined;
  return {
    requestAnimationFrame(callback: FrameRequestCallback) {
      queued = callback;
      return 1;
    },
    cancelAnimationFrame() {
      queued = undefined;
    },
    run(from: number, to: number, step: number) {
      for (let time = from; time <= to && queued; time += step) {
        const callback = queued;
        queued = undefined;
        callback(time);
      }
    },
    get pending() {
      return queued !== undefined;
    },
  };
}

it("settles upright on the target after a lean in the direction of travel", () => {
  const frames = clock();
  const motion = createCursorPreviewMotion(frames, () => {});
  motion.setTarget({ x: 0, y: 0 }, { snap: true });
  motion.setTarget({ x: 300, y: 40 }, { lean: 8 });
  frames.run(0, 48, 16);
  const moving = motion.getFrame();
  expect(moving.x).toBeGreaterThan(0);
  expect(moving.x).toBeLessThan(300);
  expect(moving.tilt).toBeGreaterThan(0);

  frames.run(64, 2000, 16);
  expect(motion.getFrame()).toEqual({ x: 300, y: 40, tilt: 0 });
  expect(frames.pending).toBe(false);
});

it("leans the other way when travelling left, never past the cap", () => {
  const frames = clock();
  const motion = createCursorPreviewMotion(frames, () => {});
  motion.setTarget({ x: 5000, y: 0 }, { snap: true });
  motion.setTarget({ x: 0, y: 0 }, { lean: 8 });
  let deepest = 0;
  for (let time = 0; time < 600; time += 16) {
    frames.run(time, time, 16);
    deepest = Math.min(deepest, motion.getFrame().tilt);
  }
  expect(deepest).toBeLessThan(-4);
  expect(deepest).toBeGreaterThanOrEqual(-8);
});

it("covers the same ground at 60 and 120 frames per second", () => {
  const at = (step: number) => {
    const frames = clock();
    const motion = createCursorPreviewMotion(frames, () => {});
    motion.setTarget({ x: 0, y: 0 }, { snap: true });
    motion.setTarget({ x: 400, y: 0 }, { lean: 8 });
    frames.run(0, 80, step);
    return motion.getFrame();
  };
  const slow = at(16);
  const fast = at(8);
  expect(Math.abs(slow.x - fast.x)).toBeLessThan(12);
  expect(Math.abs(slow.tilt - fast.tilt)).toBeLessThan(0.6);
});

it("jumps without leaning when snapped and stops its frame loop", () => {
  const frames = clock();
  const rendered: unknown[] = [];
  const motion = createCursorPreviewMotion(frames, (frame) =>
    rendered.push(frame),
  );
  motion.setTarget({ x: 0, y: 0 }, { snap: true });
  motion.setTarget({ x: 200, y: 0 }, { lean: 8 });
  frames.run(0, 32, 16);
  motion.setTarget({ x: 90, y: 10 }, { snap: true, lean: 8 });
  expect(rendered.at(-1)).toEqual({ x: 90, y: 10, tilt: 0 });
  expect(frames.pending).toBe(false);
});
