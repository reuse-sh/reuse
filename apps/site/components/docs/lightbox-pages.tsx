import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { CodeBlock } from "../shell/code-block";
import { DocLink as Link } from "./doc-link";
import { C, Keys, OverviewActions, Principles, Section, Text } from "./parts";
export function LightboxOverview({
  library,
  example,
}: {
  library: Library;
  example?: ReactNode;
}) {
  return (
    <>
      <OverviewActions library={library} />
      {example}
      <Keys>
        Click an image, then <kbd>←</kbd>
        <kbd>→</kbd> to page, <kbd>+</kbd>
        <kbd>−</kbd> to zoom, <kbd>Esc</kbd> to close.
      </Keys>

      <Principles
        rows={library.principles}
        icons={["touch", "resize", "layers", "zoom", "keyboard", "code"]}
      />
    </>
  );
}
const plannedItem = `// Planned. Not in the current release, and the shape may change.
lightbox.open([
  {
    type: "video",
    src: "/clips/marbling.mp4",
    poster: "/prints/coral-sky-800.webp",
    width: 1920,
    height: 1080,
    caption: "Ink settling on the water",
  },
]);`;
const media = [
  [
    "Images",
    "Supported",
    "Any format the browser decodes. Pass a preview source to open instantly and a larger one to zoom into.",
  ],
  [
    "Video files",
    "Planned",
    "MP4 and WebM with a poster frame, paused when you page away.",
  ],
  [
    "YouTube and Vimeo",
    "Planned",
    "Embedded players that load only when their page is shown.",
  ],
  [
    "Iframes",
    "Planned",
    "Any page you trust, such as a map or a 3D view, inside a slide.",
  ],
] as const;
export function LightboxMedia() {
  return (
    <>
      <ul className="d-status">
        {media.map(([name, state, text]) => (
          <li key={name}>
            <span className="d-status-name">{name}</span>
            <span className="c-badge" data-state={state.toLowerCase()}>
              {state}
            </span>
            <p>{text}</p>
          </li>
        ))}
      </ul>
      <Section title="Today">
        <Text>
          Pass image items: <C>src</C>, <C>alt</C>, an optional <C>caption</C>,
          a smaller <C>previewSrc</C> and the natural size. The{" "}
          <Link className="c-link" href="/lightbox/api">
            API page
          </Link>{" "}
          lists every method.
        </Text>
      </Section>
      <Section
        title={
          <>
            Planned item shape{" "}
            <span className="c-badge" data-state="planned">
              Planned
            </span>
          </>
        }
      >
        <Text>
          A sketch of what a video item may look like. It does not work in the
          current release.
        </Text>
        <div className="d-planned">
          <CodeBlock
            tabs={{
              label: "JavaScript",
              code: plannedItem,
            }}
          />
        </div>
      </Section>
    </>
  );
}
