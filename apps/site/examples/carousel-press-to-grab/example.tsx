"use client";
import { useCarousel } from "@reuse-sh/carousel/react";
import { photos } from "@/lib/photos";
import "./strip.css";

export function Example() {
  const { ref } = useCarousel({ loop: false });
  return (
    <section className="w-full min-w-0" aria-labelledby="press-prints">
      <h2
        id="press-prints"
        className="mb-3.5 text-base leading-6 font-semibold tracking-tight"
      >
        Prints to browse
      </h2>
      <section
        ref={ref}
        className="re-carousel re-pg-strip gap-3.5"
        aria-label="Prints"
      >
        {photos.slice(0, 6).map((photo) => (
          <a
            key={photo.id}
            className="re-carousel__slide grid gap-2 text-foreground"
            href="#press-prints"
            data-carousel-slide
          >
            <span className="block aspect-portrait overflow-hidden rounded-lg bg-media">
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img
                className="h-full w-full object-cover"
                src={photo.src}
                alt={photo.alt}
                width={photo.width}
                height={photo.height}
                draggable={false}
              />
            </span>
            <span className="text-sm leading-5 font-medium">
              {photo.caption}
            </span>
          </a>
        ))}
      </section>
    </section>
  );
}
