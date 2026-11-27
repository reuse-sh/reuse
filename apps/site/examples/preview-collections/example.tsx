"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";
import { photo } from "@/lib/photos";

const collections = [
  [
    "autumn",
    "The autumn run",
    "White walls and blue sky, in a small run.",
    "white-court",
  ],
  [
    "gifts",
    "Gift sets",
    "A yellow bloom in a glass vase, ready to give.",
    "yellow-bloom",
  ],
  [
    "prints",
    "Large prints",
    "Plaster steps and a vase, printed a metre wide.",
    "quiet-stair",
  ],
  [
    "studio",
    "From the studio",
    "A green sprig in a white vase, shot between jobs.",
    "green-sprig",
  ],
] as const;

export function PreviewCollections() {
  return (
    <CursorPreview
      placement="center"
      previewClassName="re-preview-collections-photo"
    >
      <nav aria-label="Collections" className="re-preview-collections">
        {collections.map(([id, name, line, picture], index) => {
          const { src, width, height } = photo(picture);
          return (
            <a key={id} href={`#${id}`} id={id} data-re-preview={src}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <b>{name}</b>
              <span>{line}</span>
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img src={src} alt="" width={width} height={height} />
            </a>
          );
        })}
      </nav>
    </CursorPreview>
  );
}

export const Example = PreviewCollections;
