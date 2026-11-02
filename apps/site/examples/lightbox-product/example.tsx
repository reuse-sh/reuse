"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useState } from "react";
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
    id: "woods",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    src: "https://reuse.sh/images/marble-woods.svg",
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
const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
];
function Options() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [size, setSize] = useState(1);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 1600);
    return () => clearTimeout(timer);
  }, [added]);
  return (
    <>
      <p>
        <strong>{sizes[size][1]}</strong>{" "}
        <span className="text-sm text-neutral-500">
          Archival paper · {sizes[size][0]} cm
        </span>
      </p>
      <p className="my-5 text-neutral-600">
        Coral, sand and blue drift across the sheet like ink on water. Printed
        to order on matte cotton paper with a 2 cm border.
      </p>
      <fieldset className="flex flex-wrap gap-3">
        <legend className="mb-2">Size</legend>
        {sizes.map(([name], index) => (
          <label key={name}>
            <input
              type="radio"
              name="print-size"
              checked={size === index}
              onChange={() => setSize(index)}
            />{" "}
            {name}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="my-6 rounded-xl bg-neutral-900 px-5 py-3 text-white disabled:opacity-50"
        disabled={!ready}
        onClick={() => setAdded(true)}
      >
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </>
  );
}
export function Example() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <div className="grid items-start gap-8 sm:grid-cols-2">
        <div>
          <Photo photo={photos[0]} items={photos} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {photos.slice(1).map((photo) => (
              <Photo key={photo.id} photo={photo} items={photos} />
            ))}
          </div>
        </div>
        <section>
          <p className="text-sm text-neutral-500">Prints / Marble</p>
          <h2 className="my-5 font-serif text-3xl font-light">
            Coral sky print
          </h2>
          <Options />
          <p className="text-sm text-neutral-500">
            Ships flat between two boards in 3 to 5 days.
          </p>
        </section>
      </div>
    </div>
  );
}
