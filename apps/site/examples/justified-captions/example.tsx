"use client";
import { JustifiedGallery } from "@reuse-sh/gallery/react";
import type { CSSProperties } from "react";
import { galleryPhotos } from "@/lib/photos";
import "./rows.css";

export function Example() {
  return (
    <JustifiedGallery
      className="re-jg-rows w-full"
      options={{ lastRow: "center" }}
      aria-label="Prints"
    >
      {galleryPhotos.map((photo) => (
        <figure
          key={photo.id}
          className="m-0"
          style={{ "--re-ratio": photo.width / photo.height } as CSSProperties}
        >
          {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
          <img
            className="re-justified-media rounded-frame bg-media"
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
          />
          <figcaption className="pt-2">
            <span className="block text-ui text-foreground">{photo.title}</span>
            <span className="block text-caption text-subtle-foreground">
              {photo.note}
            </span>
          </figcaption>
        </figure>
      ))}
    </JustifiedGallery>
  );
}
