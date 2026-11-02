"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import "@reuse-sh/lightbox/styles.css";

const photos = [
  {
    id: "mountains",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    src: "https://reuse.sh/images/marble-mountains.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "forest",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    src: "https://reuse.sh/images/marble-forest.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "woods",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    src: "https://reuse.sh/images/marble-woods.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "lake",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    src: "https://reuse.sh/images/marble-lake.svg",
    width: 1600,
    height: 1200,
  },
];
function Photo({
  photo,
  items,
  hidden = false,
  more = 0,
  className = "",
}: {
  photo: (typeof photos)[number];
  items: typeof photos;
  hidden?: boolean;
  more?: number;
  className?: string;
}) {
  const viewer = useLightbox({ thumbnails: true });
  return (
    <a
      href={photo.src}
      hidden={hidden}
      className={`relative block ${hidden ? "hidden" : ""} ${className}`}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        viewer.open(
          items.map((item) => ({
            ...item,
            thumbnailSrc: item.src,
            origin:
              item.id === photo.id
                ? event.currentTarget.querySelector("img")
                : null,
          })),
          items.indexOf(photo),
        );
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images outside Next.js. */}
      <img
        className="h-full w-full rounded-xl object-cover"
        src={photo.src}
        alt={photo.alt}
        width={1600}
        height={1200}
        draggable={false}
      />
      {more > 0 && (
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/40 text-3xl text-white">
          +{more}
        </span>
      )}
    </a>
  );
}
export function Example() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <article className="mx-auto max-w-[620px]">
        <p className="text-sm text-neutral-500">October 2026 · 5 prints</p>
        <h2 className="my-5 font-serif text-3xl font-light">
          Six colors in one tray of water
        </h2>
        <p className="my-6 text-neutral-600">
          Every print in this series starts as a tray of water and a few drops
          of ink. A comb pulls the colors into bands, and a sheet of paper lifts
          them off in one pass.
        </p>
        <figure>
          <Photo photo={photos[0]} items={photos} />
          <figcaption className="mt-2 text-sm text-neutral-500">
            Mint and ember
          </figcaption>
        </figure>
        <div className="my-6 grid grid-cols-2 gap-3">
          {photos.slice(1, 3).map((photo) => (
            <Photo key={photo.id} photo={photo} items={photos} />
          ))}
        </div>
        <p className="my-6 text-neutral-600">
          No two sheets come out alike. We kept the five where the colors stayed
          apart, and printed them on matte cotton paper at the size they were
          made.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {photos.slice(3).map((photo) => (
            <Photo key={photo.id} photo={photo} items={photos} />
          ))}
        </div>
      </article>
    </div>
  );
}
