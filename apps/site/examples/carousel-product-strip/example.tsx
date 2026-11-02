"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";

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
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
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
const prices = ["$84", "$72", "$96", "$64", "$88", "$72"];
export function Example() {
  const { ref, carousel, state } = useCarousel({ loop: false, group: "page" });
  return (
    <section className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <h2 id="series" className="mb-6 font-serif text-3xl font-light">
        More from the series
      </h2>
      <section
        ref={ref}
        className="re-carousel [--re-carousel-gap:16px] [--re-carousel-slide-width:78%] sm:[--re-carousel-slide-width:31%]"
        aria-label="Prints"
      >
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="re-carousel__slide m-0 min-w-0"
            data-carousel-slide
          >
            <a className="block" href={"#series"}>
              {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images outside Next.js. */}
              <img
                className="w-full rounded-xl object-cover aspect-[3/4]"
                src={photo.src}
                alt={photo.alt}
                width={1600}
                height={1200}
                draggable={false}
              />
            </a>
            <figcaption className="mt-2 text-sm text-neutral-500">
              {photo.caption}
              {
                <>
                  <br />
                  From {prices[index]}
                </>
              }
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="size-8 shrink-0 rounded-full border border-neutral-200 disabled:opacity-40"
          disabled={!carousel || !state.canPrev}
          onClick={() => carousel?.prev()}
          aria-label="Previous print"
        >
          ←
        </button>
        <button
          type="button"
          className="size-8 shrink-0 rounded-full border border-neutral-200 disabled:opacity-40"
          disabled={!carousel || !state.canNext}
          onClick={() => carousel?.next()}
          aria-label="Next print"
        >
          →
        </button>
        <span className="ml-auto text-sm tabular-nums" aria-live="polite">
          {carousel
            ? `${String(state.index + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`
            : `${photos.length} prints`}
        </span>
      </div>
    </section>
  );
}
