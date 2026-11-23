type Point = { x: number; y: number };
type Frame = Point & { tilt: number };
type Clock = Pick<
  Window,
  | "requestAnimationFrame"
  | "cancelAnimationFrame"
  | "setTimeout"
  | "clearTimeout"
>;

type MotionTarget = {
  snapX?: boolean;
  snapY?: boolean;
  tilt?: { max: number; direction?: 1 | -1 };
};

const FOLLOW = { stiffness: 700, damping: 45, mass: 0.4 };
const LEAN = { stiffness: 280, damping: 28, mass: 0.4 };
const LEAN_SCALE = 0.45;
const LEAN_DEADZONE = 0.45;
const LEAN_SETTLE_MS = 40;
const clamp = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value));

export function createFloatingTooltipMotion(
  clock: Clock,
  render: (frame: Frame) => void,
) {
  const current = { x: 0, y: 0, tilt: 0 };
  const target = { ...current };
  const velocity = { ...current };
  let frame: number | undefined;
  let lastTime: number | undefined;
  let leanTimer: number | undefined;

  const getFrame = () => ({ ...current });
  const unsettled = () =>
    Math.abs(target.x - current.x) +
      Math.abs(target.y - current.y) +
      Math.abs(velocity.x) +
      Math.abs(velocity.y) >
      0.15 ||
    Math.abs(target.tilt - current.tilt) + Math.abs(velocity.tilt) > 0.01;

  const animate = (time: number) => {
    frame = undefined;
    const elapsed = Math.min(0.032, (time - (lastTime ?? time - 16)) / 1000);
    lastTime = time;
    const steps = Math.ceil(elapsed / 0.005);
    const step = elapsed / steps;
    for (let index = 0; index < steps; index++) {
      for (const axis of ["x", "y", "tilt"] as const) {
        const spring = axis === "tilt" ? LEAN : FOLLOW;
        const acceleration =
          (spring.stiffness * (target[axis] - current[axis]) -
            spring.damping * velocity[axis]) /
          spring.mass;
        velocity[axis] += acceleration * step;
        current[axis] += velocity[axis] * step;
      }
    }

    if (unsettled()) frame = clock.requestAnimationFrame(animate);
    else {
      Object.assign(current, target);
      velocity.x = 0;
      velocity.y = 0;
      velocity.tilt = 0;
    }
    render(getFrame());
  };

  const run = () => {
    if (frame !== undefined) return;
    lastTime = undefined;
    frame = clock.requestAnimationFrame(animate);
  };

  const clearTilt = () => {
    clock.clearTimeout(leanTimer);
    leanTimer = undefined;
    current.tilt = 0;
    target.tilt = 0;
    velocity.tilt = 0;
  };

  return {
    getFrame,
    setPosition(next: Point, { snapX, snapY, tilt }: MotionTarget = {}) {
      const deltaX = next.x - target.x;
      target.x = next.x;
      target.y = next.y;
      if (snapX) {
        current.x = target.x;
        velocity.x = 0;
      }
      if (snapY) {
        current.y = target.y;
        velocity.y = 0;
      }

      if (tilt && tilt.max > 0 && Math.abs(deltaX) >= LEAN_DEADZONE) {
        const impulse = clamp(
          deltaX * LEAN_SCALE * (tilt.direction ?? 1),
          tilt.max,
        );
        target.tilt = clamp(current.tilt * 0.35 + impulse, tilt.max);
        clock.clearTimeout(leanTimer);
        leanTimer = clock.setTimeout(() => {
          leanTimer = undefined;
          target.tilt = 0;
          run();
        }, LEAN_SETTLE_MS);
      }

      if (unsettled()) run();
      if (snapX || snapY || frame === undefined) render(getFrame());
    },
    resetTilt() {
      const wasTilted = current.tilt !== 0;
      clearTilt();
      if (wasTilted) render(getFrame());
    },
    stop() {
      if (frame !== undefined) clock.cancelAnimationFrame(frame);
      frame = undefined;
      clearTilt();
      target.x = current.x;
      target.y = current.y;
      velocity.x = 0;
      velocity.y = 0;
    },
  };
}
