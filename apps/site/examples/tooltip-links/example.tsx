"use client";
import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
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
      className="[color:#111] [text-decoration:underline] [text-underline-offset:3px] [transition:text-decoration-color_150ms_ease] [&:hover]:[text-decoration-color:currentColor] [text-decoration-color:rgb(0_0_0_/_25%)]"
      data-re-tooltip-template={`tt-print-${id}`}
    >
      {children}
    </a>
  );
}

export function TooltipLinks() {
  return (
    <>
      <FloatingTooltipGroup>
        <article className="re-tooltip-links-x-story">
          <p className="[font-size:13px] [color:#858585]">
            Print series · October 2026
          </p>
          <h2 className="[margin-top:6px] [font-size:26px] [line-height:32px] font-semibold [letter-spacing:-0.028em] [text-wrap:balance]">
            Three prints from one tray
          </h2>
          <p className="[max-width:560px] [margin-top:16px] [font-size:16px] [line-height:27px] [color:#5b5b5b] [text-wrap:pretty]">
            The series opens with <PrintLink id="coral">Coral sky</PrintLink>,
            the first sheet we pulled.{" "}
            <PrintLink id="mint">Mint and ember</PrintLink> came from the same
            water an hour later. <PrintLink id="lilac">Lilac bloom</PrintLink>{" "}
            was the last, once the colors had softened.
          </p>
          <p
            className="[max-width:560px] [margin-top:16px] [font-size:16px] [line-height:27px] [color:#5b5b5b] [text-wrap:pretty]"
            id="links-note"
          >
            Point at a print name to see it.
          </p>
        </article>
      </FloatingTooltipGroup>
      {prints.map(([id, photo, name, text]) => (
        <Template
          key={id}
          id={`tt-print-${id}`}
          html={`<span class="re-tooltip-links-f-card"><img src="${escapeHtml(photo.src)}" alt="" width="1600" height="1200"><span class="re-tooltip-links-f-card-body"><b>${escapeHtml(name)}</b><span>${escapeHtml(text)}</span><small>prints.example.com</small></span></span>`}
        />
      ))}
    </>
  );
}

export const Example = TooltipLinks;
