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
      <FloatingTooltipGroup tooltipClassName="re-tooltip-people-popup">
        <div className="grid gap-4.5">
          {comments.map(([index, text]) => (
            <div
              key={text}
              className="flex [&>p]:min-w-0 [&>p]:flex-1 gap-3 items-start [&_p]:text-muted-foreground"
            >
              <span
                className="block shrink-0 size-7 rounded-full bg-center bg-cover shadow-ring"
                style={face(index)}
              />
              <p>
                <button
                  type="button"
                  className="p-0 border-0 rounded-md bg-transparent text-foreground font-semibold cursor-default [&:hover]:underline [&:hover]:decoration-foreground/20 [&:hover]:underline-offset-4"
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
          html={`<span class="flex items-center gap-2.5 py-1 pl-1 pr-2.5 text-label leading-4.5"><span class="block shrink-0 size-10 rounded-full bg-center bg-cover shadow-ring" style="background-image:url(${escapeHtml(photos[index].src)})"></span><span class="grid [&>b]:font-semibold [&>span]:text-muted-foreground [&>small]:text-muted-foreground [&>small]:text-caption"><b>${escapeHtml(name)}</b><span>${escapeHtml(role)}</span><small>${escapeHtml(time)}</small></span></span>`}
        />
      ))}
    </>
  );
}

export const Example = TooltipPeople;
