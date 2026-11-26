import { FOLLOW } from "./tooltip-motion.js";

type Point = { x: number; y: number };
export type CursorPreviewFrame = Point & { tilt: number };
type Clock = Pick<Window, "requestAnimationFrame" | "cancelAnimationFrame">;

const LEAN_DEGREES_PER_SPEED = 0.0065;
const LEAN_CATCH_UP_PER_SECOND = 12;
const STEP = 0.004;

export function createCursorPreviewMotion(
  clock: Clock,
  render: (frame: CursorPreviewFrame) => void,
) {
  const current = { x: 0, y: 0, tilt: 0 };
  const velocity = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let tilt = 0;
  let frame: number | undefined;
  let lastTime: number | undefined;

  const getFrame = () => ({ ...current });
  const settle = () => {
    current.x = target.x;
    current.y = target.y;
    current.tilt = 0;
    velocity.x = 0;
    velocity.y = 0;
  };
  const unsettled = () =>
    Math.abs(target.x - current.x) +
      Math.abs(target.y - current.y) +
      Math.abs(velocity.x) +
      Math.abs(velocity.y) >
      0.2 || Math.abs(current.tilt) > 0.02;

  const animate = (time: number) => {
    frame = undefined;
    const elapsed = Math.min(0.032, (time - (lastTime ?? time - 16)) / 1000);
    lastTime = time;
    const steps = Math.max(1, Math.ceil(elapsed / STEP));
    const step = elapsed / steps;
    for (let index = 0; index < steps; index++)
      for (const axis of ["x", "y"] as const) {
        const acceleration =
          (FOLLOW.stiffness * (target[axis] - current[axis]) -
            FOLLOW.damping * velocity[axis]) /
          FOLLOW.mass;
        velocity[axis] += acceleration * step;
        current[axis] += velocity[axis] * step;
      }
    const goal = Math.max(
      -tilt,
      Math.min(tilt, velocity.x * LEAN_DEGREES_PER_SPEED),
    );
    current.tilt +=
      (goal - current.tilt) *
      (1 - Math.exp(-elapsed * LEAN_CATCH_UP_PER_SECOND));
    if (unsettled()) frame = clock.requestAnimationFrame(animate);
    else {
      settle();
      lastTime = undefined;
    }
    render(getFrame());
  };

  return {
    getFrame,
    setTarget(next: Point, { snap = false, lean = 0 } = {}) {
      target.x = next.x;
      target.y = next.y;
      tilt = Math.max(0, lean);
      if (snap) {
        if (frame !== undefined) clock.cancelAnimationFrame(frame);
        frame = undefined;
        lastTime = undefined;
        settle();
        render(getFrame());
        return;
      }
      if (frame === undefined && unsettled())
        frame = clock.requestAnimationFrame(animate);
    },
    stop() {
      if (frame !== undefined) clock.cancelAnimationFrame(frame);
      frame = undefined;
      lastTime = undefined;
      target.x = current.x;
      target.y = current.y;
      velocity.x = 0;
      velocity.y = 0;
      current.tilt = 0;
    },
  };
}
