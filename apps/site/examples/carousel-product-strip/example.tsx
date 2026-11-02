"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";
import "./controls.css";

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
    <section className="w-full min-w-0">
      <div className="mb-[14px] flex items-center">
        <h2
          id="series"
          className="text-base leading-6 font-semibold tracking-[-0.012em]"
        >
          More from the series
        </h2>
        <span className="re-c-arrows re-c-arrows-ring">
          <button
            type="button"
            disabled={!carousel || !state.canPrev}
            onClick={() => carousel?.prev()}
            aria-label="Previous prints"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </button>
          <button
            type="button"
            disabled={!carousel || !state.canNext}
            onClick={() => carousel?.next()}
            aria-label="Next prints"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </span>
      </div>
      <section
        ref={ref}
        className="re-carousel [--re-carousel-gap:14px] [--re-carousel-slide-width:calc((100%_-_14px)/2)] min-[761px]:[--re-carousel-slide-width:calc((100%_-_28px)/3)]"
        aria-label="Prints"
      >
        {photos.map((photo, index) => (
          <a
            key={photo.id}
            className="re-carousel__slide grid gap-[2px] text-[color:var(--ink,#111)]"
            href="#series"
            data-carousel-slide
          >
            <span className="mb-[10px] block aspect-[4/5] overflow-hidden rounded-lg bg-[#efefed]">
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img
                className="h-full w-full object-cover"
                src={photo.src}
                alt={photo.alt}
                width={1600}
                height={1200}
                draggable={false}
              />
            </span>
            <span className="text-sm leading-5 font-[540]">
              {photo.caption}
            </span>
            <span className="text-[13.5px] leading-5 text-[color:var(--prose,#5b5b5b)]">
              From {prices[index]}
            </span>
          </a>
        ))}
      </section>
    </section>
  );
}
