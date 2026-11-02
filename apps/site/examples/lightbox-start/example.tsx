"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import "@reuse-sh/lightbox/styles.css";

const photos = [
  {
    id: "lake",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    src: "https://reuse.sh/images/marble-lake.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "mountains",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    src: "https://reuse.sh/images/marble-mountains.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "coast",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    src: "https://reuse.sh/images/marble-coast.svg",
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
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <Photo
            key={photo.id}
            photo={photo}
            items={photos}
            className={index === 0 ? "col-span-4 aspect-[4/3]" : "aspect-[4/3]"}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-neutral-500">
        Open an image. Use arrow keys to page, + and − to zoom, and Escape to
        close.
      </p>
    </div>
  );
}
