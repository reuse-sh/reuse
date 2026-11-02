"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";
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
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
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
  {
    id: "woods",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    src: "https://reuse.sh/images/marble-woods.svg",
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
    id: "coast",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    src: "https://reuse.sh/images/marble-coast.svg",
    width: 1600,
    height: 1200,
  },
];
export function Example() {
  const { ref, carousel, state } = useCarousel({ loop: true });
  const viewer = useLightbox({ thumbnails: true });
  return (
    <section className="mx-auto w-full min-w-0 max-w-[840px] font-sans text-[15px] leading-relaxed text-neutral-800">
      <section
        ref={ref}
        className="re-carousel [--re-carousel-gap:12px] [--re-carousel-slide-width:78%] sm:[--re-carousel-slide-width:47%]"
        aria-label="Prints"
      >
        {photos.map((photo, index) => (
          <figure
            key={photo.id}
            className="re-carousel__slide m-0 min-w-0"
            data-carousel-slide
          >
            <a
              className="block"
              href={photo.src}
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
                  photos.map((item) => ({
                    ...item,
                    thumbnailSrc: item.src,
                    origin:
                      item.id === photo.id
                        ? event.currentTarget.querySelector("img")
                        : null,
                  })),
                  index,
                );
              }}
            >
              {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images outside Next.js. */}
              <img
                className="w-full rounded-xl object-cover h-auto aspect-[4/5]"
                src={photo.src}
                alt={photo.alt}
                width={1600}
                height={1200}
                draggable={false}
              />
            </a>
            <figcaption className="mt-2 text-sm text-neutral-500">
              {photo.caption}
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
        {photos.map((photo, index) => (
          <button
            type="button"
            key={photo.id}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-lg text-neutral-300 aria-[current=true]:text-neutral-900"
            aria-label={`Show ${photo.caption}`}
            aria-current={state.index === index ? "true" : undefined}
            disabled={!carousel}
            onClick={() => carousel?.goTo(index)}
          >
            •
          </button>
        ))}
        <span className="ml-auto text-sm tabular-nums" aria-live="polite">
          {carousel
            ? `${String(state.index + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`
            : `${photos.length} prints`}
        </span>
      </div>
    </section>
  );
}
