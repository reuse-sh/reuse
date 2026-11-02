"use client";

import { useCarousel } from "@reuse-sh/carousel/react";
import { useLightbox } from "@reuse-sh/lightbox/react";
import Image from "next/image";
import type { CSSProperties } from "react";
import { photos } from "../../lib/photos";
import { Icon, lightboxIcons } from "../icons";

const strip = [0, 4, 6, 1, 5, 7, 2, 3].map((index) => photos[index]);

export function PhotoStrip() {
  const { ref, carousel, state } = useCarousel({ align: "start" });
  const lightbox = useLightbox({
    icons: lightboxIcons,
    thumbnails: true,
    onChange: (next) => {
      if (next.isOpen && next.index !== state.index) carousel?.goTo(next.index);
    },
  });
  const open = (index: number, trigger: HTMLElement) => {
    const images = trigger
      .closest(".re-carousel")
      ?.querySelectorAll<HTMLImageElement>("[data-carousel-slide] img");
    lightbox.open(
      strip.map((photo, at) => {
        const image = images?.[at];
        return {
          ...photo,
          thumbnailSrc: photo.src,
          previewSrc: image?.currentSrc || photo.src,
          origin: image ?? null,
        };
      }),
      index,
    );
  };
  return (
    <div className="h-strip" data-dragging={state.isDragging ? "" : undefined}>
      <section ref={ref} className="re-carousel h-strip-vp" aria-label="Photos">
        {strip.map((photo, index) => (
          <figure
            key={photo.id}
            className="re-carousel__slide h-slide"
            data-carousel-slide=""
          >
            <button
              type="button"
              aria-label={`Open ${photo.caption}`}
              onClick={(event) => open(index, event.currentTarget)}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                draggable={false}
                sizes="(max-width: 430px) 72vw, 310px"
              />
            </button>
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </section>
      <div className="c-col h-strip-ctrl">
        <div
          className="h-dots"
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
        <span className="h-arrows">
          <button
            type="button"
            aria-label="Previous slide"
            data-re-tooltip="Previous"
            disabled={!state.canPrev}
            onClick={() => carousel?.prev()}
          >
            <Icon name="arrow-left" size={16} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            data-re-tooltip="Next"
            disabled={!state.canNext}
            onClick={() => carousel?.next()}
          >
            <Icon name="arrow-right" size={16} />
          </button>
        </span>
      </div>
    </div>
  );
}
