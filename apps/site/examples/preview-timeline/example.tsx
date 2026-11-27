"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";
import { photo } from "@/lib/photos";

const years = [
  [
    "2019",
    "A borrowed table",
    "A vase and pears on a kitchen table, shot by the window.",
    "table-still-life",
  ],
  [
    "2021",
    "A first studio",
    "An empty room with a ladder and a window to the north.",
    "empty-room",
  ],
  [
    "2024",
    "Open on Saturdays",
    "People came by to look, and stayed on the sofa to talk.",
    "grey-lounge",
  ],
] as const;

export function PreviewTimeline() {
  return (
    <CursorPreview previewClassName="re-preview-timeline-photo">
      <ol className="re-preview-timeline">
        {years.map(([year, title, text, picture]) => {
          const { src, width, height } = photo(picture);
          return (
            <li key={year} data-re-preview={src}>
              <time>{year}</time>
              <h3>{title}</h3>
              <p>{text}</p>
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img src={src} alt="" width={width} height={height} />
            </li>
          );
        })}
      </ol>
    </CursorPreview>
  );
}

export const Example = PreviewTimeline;
