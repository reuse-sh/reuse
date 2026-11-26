"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";

const years = [
  [
    "2019",
    "A borrowed tray",
    "Marbling on a kitchen table, one sheet at a time.",
    "night",
  ],
  [
    "2021",
    "A first studio",
    "A garage with a long table and a window to the north.",
    "meadow",
  ],
  [
    "2024",
    "Open on Saturdays",
    "People came by to watch, and stayed to pull a sheet.",
    "mountains",
  ],
] as const;

export function PreviewTimeline() {
  return (
    <CursorPreview previewClassName="re-preview-timeline-photo">
      <ol className="re-preview-timeline">
        {years.map(([year, title, text, photo]) => {
          const src = `/images/marble-${photo}-1350x1800.webp`;
          return (
            <li key={year} data-re-preview={src}>
              <time>{year}</time>
              <h3>{title}</h3>
              <p>{text}</p>
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img src={src} alt="" width="1350" height="1800" />
            </li>
          );
        })}
      </ol>
    </CursorPreview>
  );
}

export const Example = PreviewTimeline;
