"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";
import { photo } from "@/lib/photos";

const years = [
  [
    "2019",
    "A borrowed tray",
    "Prints on a kitchen table, one sheet at a time.",
    "garden-wall",
  ],
  [
    "2021",
    "A first studio",
    "A garage with a long table and a window to the north.",
    "white-court",
  ],
  [
    "2024",
    "Open on Saturdays",
    "People came by to watch, and stayed to pull a sheet.",
    "quiet-stair",
  ],
] as const;

export function PreviewTimeline() {
  return (
    <CursorPreview previewClassName="re-preview-timeline-photo">
      <ol className="re-preview-timeline">
        {years.map(([year, title, text, picture]) => {
          const { src, srcSet, width, height } = photo(picture);
          return (
            <li key={year} data-re-preview={src}>
              <time>{year}</time>
              <h3>{title}</h3>
              <p>{text}</p>
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img
                src={src}
                srcSet={srcSet}
                sizes="(max-width: 48rem) 40vw, 160px"
                alt=""
                width={width}
                height={height}
              />
            </li>
          );
        })}
      </ol>
    </CursorPreview>
  );
}

export const Example = PreviewTimeline;
