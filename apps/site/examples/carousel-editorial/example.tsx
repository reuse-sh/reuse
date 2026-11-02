"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import "@reuse-sh/carousel/styles.css";
import "./controls.css";
import { useLightbox } from "@reuse-sh/lightbox/react";
import type { CSSProperties } from "react";
import "@reuse-sh/lightbox/styles.css";

const photos = [
  {
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
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
    id: "lake",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    src: "https://reuse.sh/images/marble-lake.svg",
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
export function Example() {
  const { ref, carousel, state } = useCarousel({ loop: true, align: "start" });
  const viewer = useLightbox({ thumbnails: true });
  return (
    <section className="w-full min-w-0 grid gap-6">
      <article>
        <p className="text-[13px] text-[color:var(--mute,#858585)]">
          Print series · October 2026
        </p>
        <h2 className="mt-[6px] text-[26px] leading-8 font-semibold tracking-[-0.028em] text-balance">
          Six sheets from one tray
        </h2>
        <p className="mt-4 max-w-[560px] text-base leading-[27px] text-[color:var(--prose,#5b5b5b)] text-pretty">
          The series started with one tray of water and six colors. These are
          the sheets we kept, in the order they were pulled.
        </p>
      </article>
      <div className="min-w-0">
        <section
          ref={ref}
          className="re-carousel [--re-carousel-gap:14px] [--re-carousel-slide-width:min(520px,84vw)] pr-4 [scroll-padding-inline:0]"
          aria-label="Photos"
        >
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className="re-carousel__slide m-0 min-w-0"
              data-carousel-slide
            >
              <a
                className="re-c-photo aspect-[3/2]"
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
              <figcaption className="mt-[10px] text-sm leading-5">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </section>
        <div className="mt-4 flex items-center gap-[14px] text-[color:var(--ink,#111)]">
          <div
            className="re-c-dots -ml-[3px]"
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
          <span className="re-c-counter" aria-live="polite">
            {carousel
              ? `${String(state.index + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`
              : `${photos.length} prints`}
          </span>
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
