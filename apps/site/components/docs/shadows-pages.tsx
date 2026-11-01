import type { Library } from "@reuse-sh/catalog";
import { shadowLevels } from "@reuse-sh/shadows";
import { CardPatterns } from "../demos/shadows";
import { basicCode } from "./basic-code";
import {
  C,
  CodePair,
  ExampleCode,
  Install,
  Keys,
  Section,
  Text,
} from "./parts";
import { FadeEdgeStrip } from "./shadows-islands";

export function ShadowsStart({ library }: { library: Library }) {
  const [classJs, classReact] = basicCode.scale;
  const [fadeJs, fadeReact] = basicCode.fadeEdge;
  return (
    <>
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section title="Add a shadow">
        <Text>
          Import the stylesheet once and put a level on any element. The ring
          variant replaces a border, so drop the one you had.
        </Text>
        <CodePair js={classJs} react={classReact} />
      </Section>
      <Section title="Fade a scrolling edge">
        <Text>
          <C>createFadeEdge</C> masks the sides of a horizontal scroller.
          Destroy it with the scroller, and it puts the old inline style back.
        </Text>
        <CodePair js={fadeJs} react={fadeReact} />
      </Section>
    </>
  );
}

export function ShadowsCards() {
  const [js, react] = basicCode.cards;
  return (
    <>
      <div className="x-cards">
        <CardPatterns />
      </div>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function ShadowsScale() {
  const [js, react] = basicCode.scale;
  return (
    <>
      {[
        ["re-shadow-*", "re-shadow-"],
        ["re-shadow-ring-*", "re-shadow-ring-"],
      ].map(([title, prefix]) => (
        <div key={title} className="x-scale">
          <h2 className="c-h3">
            <code className="d-inline">{title}</code>
          </h2>
          <ul className="x-scale-list">
            {shadowLevels.map((level) => (
              <li key={level} className="x-scale-item">
                <span className={`x-scale-tile ${prefix}${level}`} />
                <code className="x-scale-name">{level}</code>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function ShadowsFadeEdge() {
  const [js, react] = basicCode.fadeEdge;
  return (
    <>
      <FadeEdgeStrip />
      <Keys>
        Scroll the strip with a trackpad or <kbd>Shift</kbd> and the wheel, or
        focus it and press <kbd>←</kbd>
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
      <Section title="In code">
        <CodePair js={js} react={react} />
      </Section>
    </>
  );
}
