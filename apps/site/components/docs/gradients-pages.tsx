import type { Library } from "@reuse-sh/catalog";
import {
  EASINGS,
  type EasingName,
  easingGradient,
  easingStops,
} from "@reuse-sh/gradients";
import { snippets } from "../../lib/guides";
import { basicCode } from "./basic-code";
import { FadeEdgeStrip, ImageCaption } from "./gradients-islands";
import {
  C,
  CodePair,
  ExampleCode,
  Install,
  Keys,
  Section,
  Stage,
  Text,
} from "./parts";

export function GradientsStart({ library }: { library: Library }) {
  const code = snippets[library.slug];
  return (
    <>
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section title="Build a gradient">
        <Text>
          <C>easingGradient</C> returns a CSS string. Set it as a background or
          a mask, in a style attribute, CSS-in-JS or a server template. There is
          nothing to destroy.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
      <Section title="Fade a scrolling edge">
        <Text>
          <C>createFadeEdge</C> masks the sides of a horizontal scroller with
          the same eased stops. Destroy it with the scroller, and it puts the
          old inline style back.
        </Text>
        <CodePair js={basicCode.fadeEdge[0]} react={basicCode.fadeEdge[1]} />
      </Section>
    </>
  );
}

export function GradientsCaption() {
  const [js, react] = basicCode.imageCaption;
  return (
    <>
      <Stage>
        <ImageCaption />
      </Stage>
      <Text>
        Both scrims end at the same darkness. The linear one starts with a line
        you can see across the print. The eased one starts so gently that the
        image seems to darken on its own, and the text still sits on enough
        contrast.
      </Text>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function GradientsFadeEdge() {
  const [js, react] = basicCode.fadeEdge;
  return (
    <>
      <Stage>
        <FadeEdgeStrip />
      </Stage>
      <Keys>
        Drag the strip with a mouse, scroll it with a trackpad or{" "}
        <kbd>Shift</kbd> and the wheel, or focus it and press <kbd>←</kbd>
        <kbd>→</kbd>.
      </Keys>
      <Section title="Scroll and fixed">
        <Text>
          In <C>scroll</C> mode each fade grows with the distance left to
          scroll, so it fades in as you leave the start and fades out as you
          reach the end. In <C>fixed</C> mode a side is either fully faded or
          not faded at all.
        </Text>
      </Section>
      <Section title="Smooth and linear">
        <Text>
          <C>smooth</C> eases the mask in and out, so the edge has no visible
          start. <C>linear</C> is a straight ramp, a little harder at its inner
          end.
        </Text>
      </Section>
      <ExampleCode js={js} react={react} />
    </>
  );
}

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
