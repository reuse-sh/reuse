"use client";

import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import { connectCarousel } from "@reuse-sh/lightbox/carousel";
import { useLightbox } from "@reuse-sh/lightbox/react";
import Image from "next/image";
import { type CSSProperties, useEffect, useRef } from "react";
import { Container } from "@/components/ui/container";
import { photos } from "../../lib/photos";
import { Icon } from "../icons";
import { siteLightbox } from "../site-lightbox";

const strip = [0, 4, 6, 1, 5, 7, 2, 3].map((index) => photos[index]);

export function PhotoStrip() {
  const { ref, carousel } = useCarousel({ align: "start" });
  const state = useCarouselState(
    carousel,
    ({ index, canPrev, canNext, isDragging }) => ({
      index,
      canPrev,
      canNext,
      isDragging,
    }),
  );
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const lightbox = useLightbox({ ...siteLightbox, thumbnails: "bottom" });
  useEffect(() => {
    if (carousel) return connectCarousel(lightbox, carousel);
  }, [lightbox, carousel]);
  const open = (index: number) =>
    lightbox.open(
      strip.map((photo, at) => ({
        ...photo,
        thumbnailSrc: photo.src,
        previewSrc: images.current[at]?.currentSrc || photo.src,
        origin: () => images.current[at] ?? null,
      })),
      index,
    );
  return (
    <div
      className="h-strip group mt-7"
      data-dragging={state.isDragging ? "" : undefined}
    >
      <section ref={ref} className="re-carousel h-strip-vp" aria-label="Photos">
        {strip.map((photo, index) => (
          <figure
            key={photo.id}
            className="re-carousel__slide"
            data-carousel-slide=""
          >
            <button
              type="button"
              className="block aspect-portrait w-full cursor-zoom-in overflow-hidden rounded-xl bg-media p-0 focus-visible:-outline-offset-2 group-data-dragging:cursor-grabbing"
              aria-label={`Open ${photo.caption}`}
              onClick={() => open(index)}
            >
              <Image
                ref={(image) => {
                  images.current[index] = image;
                }}
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                draggable={false}
                className="size-full object-cover select-none"
                sizes="(max-width: 430px) 72vw, 310px"
              />
            </button>
            <figcaption className="mt-2.5 text-ui">{photo.caption}</figcaption>
          </figure>
        ))}
      </section>
      <Container className="mt-4 flex items-center gap-3.5">
        <div
          className="h-dots relative -ml-1 flex h-6 items-center"
          style={{ "--h-dot": state.index } as CSSProperties}
        >
          {strip.map((photo, index) => (
            <button
              type="button"
              key={photo.id}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={state.index === index ? "true" : undefined}
              onClick={() => carousel?.goTo(index)}
            />
          ))}
        </div>
        <span className="-mr-1.5 ml-auto flex gap-0.5">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-foreground transition ease-ui hover:bg-accent active:scale-95 disabled:cursor-default disabled:bg-transparent disabled:opacity-30"
            aria-label="Previous slide"
            data-re-tooltip="Previous"
            disabled={!state.canPrev}
            onClick={() => carousel?.prev()}
          >
            <Icon name="arrow-left" size={16} />
          </button>
          <button
            type="button"
            className="grid size-8 place-items-center rounded-full text-foreground transition ease-ui enabled:bg-accent enabled:hover:bg-foreground/5 active:scale-95 disabled:cursor-default disabled:opacity-30"
            aria-label="Next slide"
            data-re-tooltip="Next"
            disabled={!state.canNext}
            onClick={() => carousel?.next()}
          >
            <Icon name="arrow-right" size={16} />
          </button>
        </span>
      </Container>
    </div>
  );
}
