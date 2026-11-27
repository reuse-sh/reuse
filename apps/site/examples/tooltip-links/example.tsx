"use client";
import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";
import "./effects.css";
import { photo } from "@/lib/photos";

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}
const photos = [photo("pink-summit"), photo("open-sea"), photo("dunes")];

function Template({ id, html }: { id: string; html: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the markup is built from fixed synthetic strings, escaped with escapeHtml.
  return <template id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}

const prints = [
  [
    "summit",
    photos[0],
    photos[0].caption,
    "Shot above the clouds at dawn, pink haze over a quiet peak.",
  ],
  [
    "sea",
    photos[1],
    photos[1].caption,
    "Taken from the ferry an hour later, deep blue under a pale sky.",
  ],
  [
    "dunes",
    photos[2],
    photos[2].caption,
    "The last frame of the trip, smooth sand under a light sky.",
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
            Three prints from one trip
          </h2>
          <p className="max-w-140 mt-4 text-lead leading-7 text-muted-foreground text-pretty">
            The series opens with{" "}
            <PrintLink id="summit">{photos[0].caption}</PrintLink>, shot above
            the clouds at dawn.{" "}
            <PrintLink id="sea">{photos[1].caption}</PrintLink> came from the
            ferry an hour later.{" "}
            <PrintLink id="dunes">{photos[2].caption}</PrintLink> was the last,
            on the walk back over the sand.
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
          html={`<span class="grid grid-cols-[auto_minmax(0,1fr)] gap-3 w-72 max-w-full text-label leading-4.5 [&>img]:size-21 [&>img]:rounded-control [&>img]:object-cover"><img src="${escapeHtml(photo.src)}" srcset="${escapeHtml(photo.srcSet ?? "")}" sizes="84px" alt="" width="${photo.width}" height="${photo.height}"><span class="grid grid-cols-[minmax(0,1fr)] min-w-0 content-center gap-0.5 pr-1.5 [&>b]:font-semibold [&>b]:overflow-x-clip [&>b]:text-ellipsis [&>b]:whitespace-nowrap [&>b]:[text-box:trim-start_cap_alphabetic] [&>span]:line-clamp-2 [&>span]:text-muted-foreground [&>small]:overflow-x-clip [&>small]:text-ellipsis [&>small]:whitespace-nowrap [&>small]:text-caption [&>small]:text-subtle-foreground [&>small]:[text-box:trim-end_cap_alphabetic]"><b>${escapeHtml(name)}</b><span>${escapeHtml(text)}</span><small>prints.example.com</small></span></span>`}
        />
      ))}
    </>
  );
}

export const Example = TooltipLinks;
