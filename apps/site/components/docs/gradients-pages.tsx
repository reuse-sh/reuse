import type { EasingName } from "@reuse-sh/gradients";
import { EASINGS, easingGradient, easingStops } from "@reuse-sh/gradients";
import { basicCode } from "./basic-code";
import { C, CodePair, Section, Text } from "./parts";

const curveNotes: Record<EasingName, string> = {
  "ease-in-out-sine":
    "Quiet at both ends and quickest in the middle. The default, and the right one for most fades.",
  "ease-in":
    "Stays light for longest and darkens near the end. Good for a scrim that should leave most of the image alone.",
  "ease-out":
    "Darkens early and settles. Good when the solid end should reach further into the gradient.",
  linear:
    "One straight ramp with two stops. Its start and end show as lines on a large surface.",
};
function Plot({ easing }: { easing: EasingName }) {
  const points = easingStops(easing, 24)
    .map(
      ({ position, progress }) => `${position * 100},${100 - progress * 100}`,
    )
    .join(" ");
  return (
    <svg
      className="x-curve-plot"
      viewBox="-4 -4 108 108"
      aria-hidden="true"
      focusable="false"
    >
      <polyline points={points} />
    </svg>
  );
}
export function GradientsCurves() {
  return (
    <>
      <ul className="x-curves">
        {EASINGS.map((easing) => (
          <li key={easing} className="x-curve">
            <Plot easing={easing} />
            <span
              className="x-curve-swatch"
              style={{
                backgroundImage: easingGradient({
                  to: "#111",
                  easing,
                  direction: "to right",
                }),
              }}
            />
            <p className="x-curve-note">
              <code className="d-inline">{easing}</code> {curveNotes[easing]}
            </p>
          </li>
        ))}
      </ul>
      <Section title="Your own curve">
        <Text>
          Pass a cubic bezier as four numbers, the same values CSS takes in{" "}
          <C>cubic-bezier()</C>. The x values stay between 0 and 1. A y value
          outside that range is clamped, so the gradient never overshoots its
          colors.
        </Text>
        <CodePair js={basicCode.curves[0]} react={basicCode.curves[1]} />
      </Section>
    </>
  );
}
