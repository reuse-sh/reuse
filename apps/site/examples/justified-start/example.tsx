"use client";
import { JustifiedGallery } from "@reuse-sh/gallery/react";
import type { CSSProperties } from "react";
import { galleryPhotos } from "@/lib/photos";
import "./rows.css";

export function Example() {
  return (
    <JustifiedGallery className="re-jg-rows w-full" aria-label="Prints">
      {galleryPhotos.map((photo) => (
        // biome-ignore lint/performance/noImgElement: standalone examples use native images.
        <img
          key={photo.id}
          className="rounded-frame bg-media"
          src={photo.src}
          srcSet={photo.srcSet}
          sizes="(max-width: 48rem) 50vw, 300px"
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          style={{ "--re-ratio": photo.width / photo.height } as CSSProperties}
        />
      ))}
    </JustifiedGallery>
  );
}
