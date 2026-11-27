"use client";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import "./controls.css";
import { photo } from "@/lib/photos";

const photos = [
  photo("pink-summit"),
  photo("open-sea"),
  photo("sailboat"),
  photo("lone-pine"),
  photo("cloud-peak"),
  photo("dunes"),
];
const prices = ["$84", "$72", "$96", "$64", "$88", "$72"];
export function Example() {
  const { ref, carousel } = useCarousel({ loop: false, group: "page" });
  const state = useCarouselState(carousel, ({ canPrev, canNext }) => ({
    canPrev,
    canNext,
  }));
  return (
    <section className="w-full min-w-0">
      <div className="mb-3.5 flex items-center">
        <h2
          id="series"
          className="text-base leading-6 font-semibold tracking-tight"
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
        className="re-carousel re-c-products gap-3.5"
        aria-label="Prints"
      >
        {photos.map((photo, index) => (
          <a
            key={photo.id}
            className="re-carousel__slide grid gap-0.5 text-foreground"
            href="#series"
            data-carousel-slide
          >
            <span className="mb-2.5 block aspect-portrait overflow-hidden rounded-lg bg-media">
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img
                className="h-full w-full object-cover"
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(max-width: 48rem) 45vw, 14rem"
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                draggable={false}
              />
            </span>
            <span className="text-sm leading-5 font-medium">
              {photo.caption}
            </span>
            <span className="text-label leading-5 text-muted-foreground">
              From {prices[index]}
            </span>
          </a>
        ))}
      </section>
    </section>
  );
}
