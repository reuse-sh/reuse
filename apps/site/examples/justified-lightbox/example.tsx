"use client";
import { JustifiedGallery } from "@reuse-sh/gallery/react";
import { useLightbox } from "@reuse-sh/lightbox/react";
import type { CSSProperties } from "react";
import { siteLightbox } from "@/components/site-lightbox";
import { galleryPhotos } from "@/lib/photos";
import "./rows.css";

export function Example() {
  const viewer = useLightbox({ ...siteLightbox, thumbnails: "bottom" });
  return (
    <JustifiedGallery className="re-jg-rows w-full" aria-label="Prints">
      {galleryPhotos.map((photo, index) => (
        <button
          key={photo.id}
          type="button"
          className="rounded-frame cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          style={{ "--re-ratio": photo.width / photo.height } as CSSProperties}
          onClick={(event) => {
            const tiles =
              event.currentTarget.parentElement?.querySelectorAll("img");
            viewer.open(
              galleryPhotos.map((item, at) => ({
                src: item.src,
                srcset: item.srcSet,
                alt: item.alt,
                caption: item.caption,
                width: item.width,
                height: item.height,
                thumbnailSrc: item.src,
                origin: tiles?.[at] ?? null,
              })),
              index,
            );
          }}
        >
          {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
          <img
            className="re-justified-media rounded-frame bg-media"
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(max-width: 48rem) 50vw, 300px"
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            draggable={false}
          />
        </button>
      ))}
    </JustifiedGallery>
  );
}
