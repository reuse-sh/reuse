"use client";
import { CursorPreview } from "@reuse-sh/interactions/react";
import "./effects.css";

const collections = [
  ["autumn", "The autumn run", "Coral and sand, in a small run.", "lake"],
  ["gifts", "Gift sets", "Boxed, wrapped and ready to give.", "woods"],
  ["prints", "Large prints", "Pulled by hand, one sheet at a time.", "coast"],
  ["studio", "From the studio", "Test sheets and the ones we kept.", "dune"],
] as const;

export function PreviewCollections() {
  return (
    <CursorPreview
      placement="center"
      previewClassName="re-preview-collections-photo"
    >
      <nav aria-label="Collections" className="re-preview-collections">
        {collections.map(([id, name, line, photo], index) => {
          const src = `/images/marble-${photo}-1350x1800.webp`;
          return (
            <a key={id} href={`#${id}`} id={id} data-re-preview={src}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <b>{name}</b>
              <span>{line}</span>
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img src={src} alt="" width="1350" height="1800" />
            </a>
          );
        })}
      </nav>
    </CursorPreview>
  );
}

export const Example = PreviewCollections;
