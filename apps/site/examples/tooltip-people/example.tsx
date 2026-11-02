"use client";
import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
import type { CSSProperties } from "react";
import "./effects.css";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}
const photos = [
  {
    src: "https://reuse.sh/images/marble-lake.svg",
    alt: "A soft marble texture in coral, sand and blue",
    width: 1600,
    height: 1200,
  },
  {
    src: "https://reuse.sh/images/marble-mountains.svg",
    alt: "A soft marble texture in mint, blue and orange",
    width: 1600,
    height: 1200,
  },
  {
    src: "https://reuse.sh/images/marble-coast.svg",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 1600,
    height: 1200,
  },
];

function Template({ id, html }: { id: string; html: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the markup is built from fixed synthetic strings, escaped with escapeHtml.
  return <template id={id} dangerouslySetInnerHTML={{ __html: html }} />;
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
  return (
    <>
      <FloatingTooltipGroup>
        <div className="grid [gap:18px]">
          {comments.map(([index, text]) => (
            <div
              key={text}
              className="grid [grid-template-columns:28px_minmax(0,_1fr)] gap-3 items-start [&_p]:[color:#5b5b5b]"
            >
              <span
                className="re-tooltip-people-f-face re-tooltip-people-f-face-sm"
                style={face(index)}
              />
              <p>
                <button
                  type="button"
                  className="p-0 border-0 [border-radius:4px] [background:none] [color:#111] [font-weight:560] cursor-default [&:hover]:[text-decoration:underline] [&:hover]:[text-decoration-color:rgb(0_0_0_/_20%)] [&:hover]:[text-underline-offset:3px]"
                  data-re-tooltip-template={`tt-person-${index}`}
                >
                  {people[index][0]}
                </button>{" "}
                {text}
              </p>
            </div>
          ))}
        </div>
      </FloatingTooltipGroup>
      {people.map(([name, role, time], index) => (
        <Template
          key={name}
          id={`tt-person-${index}`}
          html={`<span class="re-tooltip-people-f-person"><span class="re-tooltip-people-f-face" style="background-image:url(${escapeHtml(photos[index].src)})"></span><span class="re-tooltip-people-f-person-body"><b>${escapeHtml(name)}</b><span>${escapeHtml(role)}</span><small>${escapeHtml(time)}</small></span></span>`}
        />
      ))}
    </>
  );
}

export const Example = TooltipPeople;
