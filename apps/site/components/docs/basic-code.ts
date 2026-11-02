export const basicCode: Record<string, readonly [string, string]> = {
  curves: [
    `import { easingGradient, easingStops } from "@reuse-sh/gradients";

const fade = easingGradient({
  from: "var(--surface)",
  to: "transparent",
  easing: [0.23, 1, 0.32, 1],
  stops: 16,
});

// Or take the samples and write the gradient yourself.
const stops = easingStops("ease-out", 8);`,
    `import { easingGradient } from "@reuse-sh/gradients";

const fade = easingGradient({
  from: "var(--surface)",
  to: "transparent",
  easing: [0.23, 1, 0.32, 1],
});

export function Fade() {
  return <div className="fade" style={{ backgroundImage: fade }} />;
}`,
  ],
};
