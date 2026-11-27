"use client";
import { Masonry } from "@reuse-sh/gallery/react";
import { galleryPhotos } from "@/lib/photos";
import "./cards.css";

const texts = [
  "Layered ridges in cyan and slate.",
  "A tall print for a narrow wall. Printed on cotton rag.",
  "One tree on a white field.",
  "A single leaf in a square frame.",
  "A wide band of evening light for a long shelf or a hallway.",
  "Plaster steps, cut upright.",
  "Sand under a light sky.",
  "White walls and a deep blue sky.",
  "A green sprig against grey-blue.",
  "Soft waves along a low horizon.",
  "Peach and pink in a square, quieter than the wide print.",
  "A road that fades into fog.",
];

export function Example() {
  return (
    <Masonry className="re-mg-cards w-full" aria-label="Prints">
      {galleryPhotos.map((photo, index) => (
        <article key={photo.id}>
          {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
          <img
            className="block h-auto w-full rounded-frame bg-media"
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="(max-width: 48rem) 100vw, 300px"
            alt=""
            width={photo.width}
            height={photo.height}
          />
          <h3 className="mt-2.5 text-ui font-medium text-foreground">
            {photo.caption}
          </h3>
          <p className="text-caption text-muted-foreground">{texts[index]}</p>
        </article>
      ))}
    </Masonry>
  );
}
