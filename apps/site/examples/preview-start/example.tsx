"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";

const prints = [
  ["coral", "Coral sky", "Coral, sand and blue", "lake"],
  ["mint", "Mint and ember", "Mint, blue and orange", "mountains"],
  ["lilac", "Lilac bloom", "Lilac, rose and sea green", "coast"],
  ["fern", "Sand and fern", "Sand, green and violet", "forest"],
  ["hour", "Blue hour", "Blue, lilac and gold", "night"],
] as const;

export function PreviewStart() {
  return (
    <CursorPreview previewClassName="re-preview-start-photo">
      <ol className="re-preview-start-list">
        {prints.map(([id, name, colors, photo], index) => {
          const src = `/images/marble-${photo}-1350x1800.webp`;
          return (
            <li key={id} id={`print-${id}`}>
              <a href={`#print-${id}`} data-re-preview={src}>
                <span className="re-preview-start-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
                <img
                  className="re-preview-start-thumb"
                  src={src}
                  alt=""
                  width="1350"
                  height="1800"
                />
                <b>{name}</b>
                <span className="re-preview-start-colors">{colors}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </CursorPreview>
  );
}

export const Example = PreviewStart;
