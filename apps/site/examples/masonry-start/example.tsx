"use client";
import { Masonry } from "@reuse-sh/gallery/react";
import { galleryPhotos } from "@/lib/photos";
import "./cards.css";

const texts = [
  "Warm coral over a calm sand ground.",
  "A tall print for a narrow wall. Printed on cotton rag.",
  "Mint and orange drift across a blue field.",
  "Lilac and rose in a square frame.",
  "A wide band of amber for a long shelf or a hallway.",
  "Sand and fern, cut upright.",
  "Sea green with a pink edge.",
  "Periwinkle and peach, the colors of late evening.",
  "A narrow crop of Mint and ember. It pairs with the wide one.",
  "Lilac and sea green along a low horizon.",
  "Blue and lilac with a thin gold seam near the edge.",
  "Orange and yellow in a square, quieter than the wide print.",
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
            alt=""
            width={photo.width}
            height={photo.height}
          />
          <h3 className="mt-2.5 text-ui font-medium text-foreground">
            {photo.title}
          </h3>
          <p className="text-caption text-muted-foreground">{texts[index]}</p>
        </article>
      ))}
    </Masonry>
  );
}
