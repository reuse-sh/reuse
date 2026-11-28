"use client";
import { bindCarouselControls } from "@reuse-sh/carousel/controls";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import "./controls.css";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { type CSSProperties, useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { photo } from "@/lib/photos";

const photos = [
  photo("sailboat"),
  photo("open-sea"),
  photo("pink-summit"),
  photo("lone-pine"),
  photo("cloud-peak"),
  photo("dunes"),
];
const pad = (value: number) => String(value).padStart(2, "0");
const strings = {
  counter: (index: number, count: number) =>
    `${pad(index + 1)} / ${pad(count)}`,
};
export function Example() {
  const root = useRef<HTMLElement>(null);
  const { ref, carousel } = useCarousel({
    loop: true,
    align: "start",
    strings,
  });
  const page = useCarouselState(carousel, (state) => state.pageIndex);
  useEffect(() => {
    if (carousel && root.current)
      return bindCarouselControls(root.current, carousel);
  }, [carousel]);
  const viewer = useLightbox({ thumbnails: "bottom" });
  return (
    <section ref={root} className="w-full min-w-0 grid gap-6">
      <article>
        <p className="text-label text-subtle-foreground">
          Print series · October 2026
        </p>
        <h2 className="mt-1.5 text-2xl leading-8 font-semibold tracking-tight text-balance">
          Six frames from one trip
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground text-pretty">
          The series started with one trip and a small camera. These are the
          frames we kept, in the order they were taken.
        </p>
      </article>
      <div className="min-w-0">
        <section
          ref={ref}
          className="re-carousel gap-3.5 -me-8 pe-8 scroll-p-0"
          aria-label="Photos"
        >
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className="re-carousel__slide m-0 min-w-0 basis-carousel-story"
              data-carousel-slide
            >
              <a
                className="re-c-photo aspect-landscape"
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
                      srcset: item.srcSet,
                      thumbnailSrc: item.src,
                      origin: tiles?.[at] ?? null,
                    })),
                    index,
                  );
                }}
              >
                <Picture photo={photo} sizes="(max-width: 48rem) 80vw, 22rem" />
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
            data-carousel-dots
            style={{ "--re-c-dot": page } as CSSProperties}
          >
            {photos.map((photo) => (
              <button
                type="button"
                key={photo.id}
                aria-label={`Show ${photo.caption}`}
                disabled={!carousel}
              />
            ))}
          </div>
          <span
            className="re-c-counter"
            aria-live="polite"
            data-carousel-counter
          >
            {photos.length} prints
          </span>
          <span className="re-c-arrows">
            <button
              type="button"
              disabled
              data-carousel-prev
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
              disabled
              data-carousel-next
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
