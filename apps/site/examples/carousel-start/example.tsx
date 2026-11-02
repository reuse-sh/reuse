"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import "./controls.css";
import { useLightbox } from "@reuse-sh/lightbox/react";
import type { CSSProperties } from "react";

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
  const { ref, carousel, state } = useCarousel({ loop: true, align: "start" });
  const viewer = useLightbox({ thumbnails: true });
  return (
    <section className="w-full min-w-0">
      <div>
        <section
          ref={ref}
          className="re-carousel gap-3 pr-4 scroll-p-0"
          aria-label="Photos"
        >
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className="re-carousel__slide m-0 min-w-0 basis-carousel-card"
              data-carousel-slide
            >
              <a
                className="re-c-photo aspect-portrait"
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
                {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={1600}
                  height={1200}
                  draggable={false}
                />
              </a>
              <figcaption className="mt-2.5 text-sm leading-5">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </section>
        <div className="mt-4 flex items-center gap-3.5 text-foreground">
          <div
            className="re-c-dots -ml-1"
            data-dots
            style={{ "--re-c-dot": state.index } as CSSProperties}
          >
            {photos.map((photo, index) => (
              <button
                type="button"
                key={photo.id}
                aria-label={`Show ${photo.caption}`}
                aria-current={state.index === index ? "true" : undefined}
                disabled={!carousel}
                onClick={() => carousel?.goTo(index)}
              />
            ))}
          </div>
          <span className="re-c-arrows">
            <button
              type="button"
              disabled={!carousel || !state.canPrev}
              onClick={() => carousel?.prev()}
              aria-label="Previous slide"
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
              aria-label="Next slide"
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
      </div>
    </section>
  );
}
