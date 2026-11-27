"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";
import { photo } from "@/lib/photos";

const prints = [
  ["stair", "Plaster, sand and shade", "quiet-stair"],
  ["sprig", "Sage, white and grey", "green-sprig"],
  ["court", "White, blue and shadow", "white-court"],
  ["bloom", "Glass, yellow and oak", "yellow-bloom"],
  ["garden", "Concrete, green and sand", "garden-wall"],
] as const;

export function PreviewStart() {
  return (
    <CursorPreview previewClassName="re-preview-start-photo">
      <ol className="re-preview-start-list">
        {prints.map(([id, colors, picture], index) => {
          const { src, width, height, caption } = photo(picture);
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
                  width={width}
                  height={height}
                />
                <b>{caption}</b>
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
