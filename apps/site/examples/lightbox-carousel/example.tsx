"use client";
import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import { connectCarousel } from "@reuse-sh/lightbox/carousel";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useRef } from "react";
import { ArrowIcon } from "@/components/lucide-arrows";
import { siteLightbox } from "@/components/site-lightbox";
import { Button } from "@/components/ui/button";
import { photos } from "@/lib/photos";
import "./strip.css";

const items = photos.map((photo) => ({
  src: photo.src,
  srcset: photo.srcSet,
  alt: photo.alt,
  caption: photo.caption,
  width: photo.width,
  height: photo.height,
  thumbnailSrc: photo.src,
}));

export function Example() {
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const viewer = useLightbox({ ...siteLightbox, thumbnails: "bottom" });
  const opened = items.map((item, index) => ({
    ...item,
    origin: () => images.current[index] ?? null,
  }));
  const { ref, carousel } = useCarousel({ loop: false });
  const state = useCarouselState(carousel, ({ canPrev, canNext }) => ({
    canPrev,
    canNext,
  }));
  useEffect(() => {
    if (carousel) return connectCarousel(viewer, carousel);
  }, [viewer, carousel]);
  return (
    <section className="w-full min-w-0" aria-labelledby="photo-series">
      <div className="mb-3.5 flex items-center gap-2">
        <h2
          id="photo-series"
          className="me-auto text-base leading-6 font-semibold tracking-tight"
        >
          Photo series
        </h2>
        <Button
          variant="ghost"
          size="icon"
          disabled={!carousel || !state.canPrev}
          onClick={() => carousel?.prev()}
          aria-label="Previous photos"
        >
          <ArrowIcon name="left" className="rtl:-scale-x-100" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!carousel || !state.canNext}
          onClick={() => carousel?.next()}
          aria-label="Next photos"
        >
          <ArrowIcon name="right" className="rtl:-scale-x-100" />
        </Button>
      </div>
      <section
        ref={ref}
        className="re-carousel re-lc-strip"
        aria-label="Photos"
      >
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            className="re-carousel__slide grid gap-2 rounded-lg text-start text-foreground cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            data-carousel-slide
            onClick={() => viewer.open(opened, index)}
          >
            {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
            <img
              ref={(image) => {
                images.current[index] = image;
              }}
              className="aspect-landscape w-full rounded-lg bg-media object-cover"
              src={photo.src}
              srcSet={photo.srcSet}
              sizes="(max-width: 48rem) 50vw, 200px"
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              draggable={false}
            />
            <span className="text-label font-medium">{photo.caption}</span>
          </button>
        ))}
      </section>
    </section>
  );
}
