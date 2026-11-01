import type { Library } from "@reuse-sh/catalog";
import { escapeHtml } from "@reuse-sh/core/escape-html";
import type { CSSProperties } from "react";
import { snippets } from "../../lib/guides";
import { photos } from "../../lib/photos";
import { DocIcon, type DocIconName } from "./doc-icon";
import { tooltipCode } from "./example-code";
import {
  C,
  CodePair,
  ExampleCode,
  Install,
  Keys,
  OverviewActions,
  Principles,
  Section,
  Text,
} from "./parts";
import { PhotoButton, PhotoLightbox } from "./photos";

/** Tooltip content cloned by the shared tooltip; innerHTML fills the template's content fragment. */
function Template({ id, html }: { id: string; html: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the markup is built from fixed synthetic strings, escaped with escapeHtml.
  return <template id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}

type Tool = readonly [icon: DocIconName, label: string, shortcut?: string];

function Toolbar({ tools, className }: { tools: Tool[]; className?: string }) {
  return (
    <div
      className={["d-tools", className].filter(Boolean).join(" ")}
      role="toolbar"
      aria-label="Photo actions"
    >
      {tools.map(([icon, label, shortcut]) =>
        shortcut ? (
          <span key={label} className="d-tool">
            <button
              type="button"
              aria-label={label}
              data-re-tooltip-template={`tt-${icon}`}
            >
              <DocIcon name={icon} size={18} />
            </button>
            <Template
              id={`tt-${icon}`}
              html={`<span class="f-tip-keys">${escapeHtml(label)}<kbd>${escapeHtml(shortcut)}</kbd></span>`}
            />
          </span>
        ) : (
          <button
            key={label}
            type="button"
            aria-label={label}
            data-re-tooltip={label}
          >
            <DocIcon name={icon} size={18} />
          </button>
        ),
      )}
    </div>
  );
}

export function TooltipOverview({ library }: { library: Library }) {
  return (
    <>
      <OverviewActions library={library} />
      <div className="d-stage">
        <Toolbar
          className="d-tools-lg"
          tools={[
            ["zoom", "Zoom in"],
            ["heart", "Add to favorites"],
            ["share", "Share"],
            ["link", "Copy link"],
            ["trash", "Move to trash"],
          ]}
        />
      </div>
      <Keys>
        Move along the toolbar, or press <kbd>Tab</kbd> to reach it and{" "}
        <kbd>Esc</kbd> to hide the hint.
      </Keys>
      <Principles
        rows={library.principles}
        icons={["layers", "cursor", "keyboard", "touch", "doc", "resize"]}
      />
    </>
  );
}

export function TooltipStart({ library }: { library: Library }) {
  const code = snippets["floating-tooltip"];
  return (
    <>
      <Section title="Install">
        <Text>
          Floating tooltip ships in the interactions package with Moving
          highlight and Hold to confirm.
        </Text>
        <Install library={library} />
      </Section>
      <Section title="Bind a toolbar">
        <Text>
          Give each trigger a <C>data-re-tooltip</C> with its hint. Icon buttons
          keep their own <C>aria-label</C>; the tooltip adds itself to{" "}
          <C>aria-describedby</C> while it is open.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
      <Section title="Clean up">
        <Text>
          <C>destroy()</C> removes the popup and every listener. The React group
          does this when it unmounts.
        </Text>
      </Section>
    </>
  );
}

export function TooltipShortcuts() {
  const [js, react] = tooltipCode.shortcuts;
  return (
    <>
      <PhotoLightbox className="d-stage d-stage-editor">
        <div className="x-editor">
          <PhotoButton photo={photos[1]} className="x-editor-photo" />
          <Toolbar
            className="x-editor-bar"
            tools={[
              ["plus", "Zoom in", "⌘+"],
              ["minus", "Zoom out", "⌘−"],
              ["layers", "Duplicate", "⌘D"],
              ["link", "Copy link", "⌘L"],
              ["share", "Share", "⇧⌘S"],
              ["trash", "Delete", "⌫"],
            ]}
          />
        </div>
      </PhotoLightbox>
      <ExampleCode js={js} react={react} />
    </>
  );
}

const prints = [
  [
    "coral",
    photos[0],
    "Coral sky",
    "The first sheet pulled from the tray. Coral and sand over a cool blue.",
  ],
  [
    "mint",
    photos[1],
    "Mint and ember",
    "Pulled an hour later, after the orange had sunk to the bottom.",
  ],
  [
    "lilac",
    photos[2],
    "Lilac bloom",
    "The last sheet of the day, once the colors had softened.",
  ],
] as const;

function PrintLink({ id, children }: { id: string; children: string }) {
  return (
    <a
      href="#links-note"
      className="c-link"
      data-re-tooltip-template={`tt-print-${id}`}
    >
      {children}
    </a>
  );
}

export function TooltipLinks() {
  const [js, react] = tooltipCode.links;
  return (
    <>
      <article className="x-story">
        <p className="x-date">Print series · October 2026</p>
        <h2 className="x-j-title">Three prints from one tray</h2>
        <p className="x-j-text">
          The series opens with <PrintLink id="coral">Coral sky</PrintLink>, the
          first sheet we pulled. <PrintLink id="mint">Mint and ember</PrintLink>{" "}
          came from the same water an hour later.{" "}
          <PrintLink id="lilac">Lilac bloom</PrintLink> was the last, once the
          colors had softened.
        </p>
        <p className="x-j-text" id="links-note">
          Point at a print name to see it.
        </p>
      </article>
      {prints.map(([id, photo, name, text]) => (
        <Template
          key={id}
          id={`tt-print-${id}`}
          html={`<span class="f-card"><img src="${escapeHtml(photo.src)}" alt="" width="1600" height="1200"><span class="f-card-body"><b>${escapeHtml(name)}</b><span>${escapeHtml(text)}</span><small>prints.example.com</small></span></span>`}
        />
      ))}
      <ExampleCode js={js} react={react} />
    </>
  );
}

const people = [
  ["Mara Lind", "Print editor", "09:42 in Lisbon"],
  ["Jonas Weber", "Producer", "10:42 in Berlin"],
  ["Aiko Tanaka", "Writer", "16:42 in Taipei"],
] as const;

const comments = [
  [0, "The second crop of Coral sky reads better. Can we try it as the cover?"],
  [
    1,
    "Works for me. The print run closes on Friday, so we have until Thursday night.",
  ],
  [2, "I'll trim the caption to one line so it sits under the photo."],
] as const;

const face = (index: number) =>
  ({ backgroundImage: `url(${photos[index].src})` }) as CSSProperties;

export function TooltipPeople() {
  const [js, react] = tooltipCode.people;
  return (
    <>
      <div className="x-thread-list">
        {comments.map(([index, text]) => (
          <div key={text} className="x-comment">
            <span className="f-face f-face-sm" style={face(index)} />
            <p>
              <button
                type="button"
                className="x-name"
                data-re-tooltip-template={`tt-person-${index}`}
              >
                {people[index][0]}
              </button>{" "}
              {text}
            </p>
          </div>
        ))}
      </div>
      {people.map(([name, role, time], index) => (
        <Template
          key={name}
          id={`tt-person-${index}`}
          html={`<span class="f-person"><span class="f-face" style="background-image:url(${escapeHtml(photos[index].src)})"></span><span class="f-person-body"><b>${escapeHtml(name)}</b><span>${escapeHtml(role)}</span><small>${escapeHtml(time)}</small></span></span>`}
        />
      ))}
      <ExampleCode js={js} react={react} />
    </>
  );
}
