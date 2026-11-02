"use client";

import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";

const photos = [
  {
    src: "https://reuse.sh/images/marble-lake.svg",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
  },
  {
    src: "https://reuse.sh/images/marble-mountains.svg",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
  },
  {
    src: "https://reuse.sh/images/marble-coast.svg",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
  },
  {
    src: "https://reuse.sh/images/marble-forest.svg",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
  },
  {
    src: "https://reuse.sh/images/marble-night.svg",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
  },
  {
    src: "https://reuse.sh/images/marble-woods.svg",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
  },
];

export function PrintCarousel() {
  const { ref, carousel, state } = useCarousel();

  return (
    <section
      aria-label="Print collection"
      className="@container w-full min-w-0 bg-white text-[#111] [--re-carousel-gap:12px] [--re-carousel-slide-width:68%]"
    >
      <section
        ref={ref}
        aria-label="Art prints"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scroll region needs keyboard focus before hydration.
        tabIndex={0}
        className="re-carousel [@container(min-width:480px)]:[--re-carousel-slide-width:44%]"
      >
        {photos.map((photo) => (
          <figure
            key={photo.src}
            data-carousel-slide=""
            className="re-carousel__slide m-0"
          >
            <a
              href={photo.src}
              className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {/* biome-ignore lint/performance/noImgElement: this example runs in any React app and serves SVG fixtures directly. */}
              <img
                src={photo.src}
                alt={photo.alt}
                width={1600}
                height={1200}
                draggable={false}
                className="block h-[190px] w-full rounded-xl object-cover"
              />
            </a>
            <figcaption className="mt-2 text-sm leading-5 text-[#5b5b5b]">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </section>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span
          aria-live="polite"
          aria-atomic="true"
          className="text-sm leading-5 text-[#5b5b5b] tabular-nums"
        >
          {carousel
            ? `${state.index + 1} / ${photos.length}`
            : `${photos.length} prints`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={!carousel || !state.canPrev}
            onClick={() => carousel?.prev()}
            className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#111] enabled:cursor-pointer enabled:hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-35"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 5-7 7 7 7M5 12h14" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={!carousel || !state.canNext}
            onClick={() => carousel?.next()}
            className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#111] enabled:cursor-pointer enabled:hover:bg-black/[0.03] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:opacity-35"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 5 7 7-7 7M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
