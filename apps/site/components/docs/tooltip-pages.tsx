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
  Features,
  Install,
  Keys,
  OverviewActions,
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
              data-reuse-tooltip-template={`tt-${icon}`}
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
            data-reuse-tooltip={label}
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
      <Features
        rows={library.features}
        icons={["layers", "cursor", "feather", "doc", "keyboard", "resize"]}
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
          Give each trigger a <C>data-reuse-tooltip</C> with its hint. Icon
          buttons keep their own <C>aria-label</C>; the tooltip adds itself to{" "}
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

const places = [
  [
    "lake",
    photos[0],
    "Lago di Braies",
    "A lake below the Seekofel, reached by a flat path from the car park.",
  ],
  [
    "valley",
    photos[1],
    "Kluane",
    "A glacial valley in the Yukon, wider than the eye can measure.",
  ],
  [
    "ridge",
    photos[2],
    "Smoky Mountains",
    "Ridges that turn blue toward evening, one behind the other.",
  ],
] as const;

function Place({ id, children }: { id: string; children: string }) {
  return (
    <a
      href="#links-note"
      className="c-link"
      data-reuse-tooltip-template={`tt-place-${id}`}
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
        <p className="x-date">Field notes · October 2026</p>
        <h2 className="x-j-title">Three lakes and a valley</h2>
        <p className="x-j-text">
          We started at <Place id="lake">Lago di Braies</Place> before the buses
          came, crossed the border by noon and slept two nights later at the
          mouth of <Place id="valley">the Kluane valley</Place>. The last stop,{" "}
          <Place id="ridge">the Smoky Mountains</Place>, was the only one with
          rain.
        </p>
        <p className="x-j-text" id="links-note">
          Point at a place name to see where it is.
        </p>
      </article>
      {places.map(([id, photo, name, text]) => (
        <Template
          key={id}
          id={`tt-place-${id}`}
          html={`<span class="f-card"><img src="${escapeHtml(photo.src)}" alt="" width="1600" height="1200"><span class="f-card-body"><b>${escapeHtml(name)}</b><span>${escapeHtml(text)}</span><small>maps.example.com</small></span></span>`}
        />
      ))}
      <ExampleCode js={js} react={react} />
    </>
  );
}

const people = [
  ["Mara Lind", "Photo editor", "09:42 in Lisbon"],
  ["Jonas Weber", "Producer", "10:42 in Berlin"],
  ["Aiko Tanaka", "Writer", "16:42 in Taipei"],
] as const;

const comments = [
  [0, "The second crop of the lake reads better. Can we try it as the cover?"],
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
                data-reuse-tooltip-template={`tt-person-${index}`}
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
