"use client";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import "./controls.css";
import { useLightbox } from "@reuse-sh/lightbox/react";
import type { CSSProperties } from "react";
import { siteLightbox } from "@/components/site-lightbox";
import { photo } from "@/lib/photos";

const photos = [
  photo("open-sea"),
  photo("sailboat"),
  photo("pink-summit"),
  photo("cloud-peak"),
  photo("lone-pine"),
  photo("dunes"),
];
export function Example() {
  const { ref, carousel } = useCarousel({ loop: true, align: "start" });
  const state = useCarouselState(carousel, ({ index, canPrev, canNext }) => ({
    index,
    canPrev,
    canNext,
  }));
  const viewer = useLightbox({ ...siteLightbox, thumbnails: "bottom" });
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
                  const tiles = event.currentTarget
                    .closest(".re-carousel")
                    ?.querySelectorAll("img");
                  viewer.open(
                    photos.map((item, at) => ({
                      ...item,
                      thumbnailSrc: item.src,
                      origin: tiles?.[at] ?? null,
                    })),
                    index,
                  );
                }}
              >
                {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(max-width: 48rem) 80vw, 288px"
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
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
