"use client";
import { Masonry } from "@reuse-sh/gallery/react";
import { Picture } from "@/components/picture";
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
          <Picture
            photo={photo}
            className="block h-auto w-full rounded-control bg-media"
            sizes="(max-width: 48rem) 100vw, 400px"
            alt=""
          />
          <h3 className="mt-2.5 text-ui font-medium text-foreground">
            {photo.caption}
          </h3>
          <p className="text-caption text-muted-foreground">{photo.author}</p>
        </article>
      ))}
    </Masonry>
  );
}
