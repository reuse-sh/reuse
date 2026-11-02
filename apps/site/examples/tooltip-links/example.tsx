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
      className="text-foreground underline underline-offset-4 transition-colors duration-150 [&:hover]:decoration-current decoration-foreground/25"
      data-re-tooltip-template={`tt-print-${id}`}
    >
      {children}
    </a>
  );
}

export function TooltipLinks() {
  return (
    <>
      <FloatingTooltipGroup tooltipClassName="re-tooltip-links-popup">
        <article className="re-tooltip-links-x-story">
          <p className="text-label text-subtle-foreground">
            Print series · October 2026
          </p>
          <h2 className="mt-1.5 text-2xl leading-8 font-semibold tracking-tight text-balance">
            Three prints from one tray
          </h2>
          <p className="max-w-140 mt-4 text-lead leading-7 text-muted-foreground text-pretty">
            The series opens with <PrintLink id="coral">Coral sky</PrintLink>,
            the first sheet we pulled.{" "}
            <PrintLink id="mint">Mint and ember</PrintLink> came from the same
            water an hour later. <PrintLink id="lilac">Lilac bloom</PrintLink>{" "}
            was the last, once the colors had softened.
          </p>
          <p
            className="max-w-140 mt-4 text-lead leading-7 text-muted-foreground text-pretty"
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
          html={`<span class="grid grid-cols-3 gap-3 w-72 max-w-full text-label leading-4.5 [&>img]:w-21 [&>img]:h-21 [&>img]:rounded-control [&>img]:object-cover"><img src="${escapeHtml(photo.src)}" alt="" width="1600" height="1200"><span class="col-span-2 grid content-start gap-0.5 pt-0.5 pr-1.5 [&>b]:font-semibold [&>span]:text-muted-foreground [&>small]:mt-0.5 [&>small]:text-caption [&>small]:text-subtle-foreground"><b>${escapeHtml(name)}</b><span>${escapeHtml(text)}</span><small>prints.example.com</small></span></span>`}
        />
      ))}
    </>
  );
}

export const Example = TooltipLinks;
