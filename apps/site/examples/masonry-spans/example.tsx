"use client";
import { Masonry } from "@reuse-sh/gallery/react";
import { galleryPhotos } from "@/lib/photos";
import "./cards.css";

const featured = galleryPhotos[4];
const cards = [
  featured,
  ...galleryPhotos.filter((photo) => photo !== featured),
];

export function Example() {
  return (
    <Masonry className="re-mg-spans @container w-full" aria-label="Prints">
      {cards.map((photo) => (
        <article
          key={photo.id}
          className={photo === featured ? "@sm:col-span-2" : undefined}
        >
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
          <p className="text-caption text-muted-foreground">{photo.note}</p>
        </article>
      ))}
    </Masonry>
  );
}
