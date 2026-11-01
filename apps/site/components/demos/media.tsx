"use client";

import { useCarousel } from "@reuse-sh/carousel/react";
import { useLightbox } from "@reuse-sh/lightbox/react";
import Image from "next/image";
import { type CSSProperties, useState } from "react";
import { photos } from "../../lib/photos";
import { Icon, lightboxIcons } from "../icons";

export function GalleryDemo({ compact = false }: { compact?: boolean }) {
  const lightbox = useLightbox({
    className: "site-lightbox",
    icons: lightboxIcons,
    thumbnails: true,
  });
  const selected = compact ? photos.slice(0, 3) : photos;
  return (
    <div className={`gallery-demo ${compact ? "gallery-compact" : ""}`}>
      <div className="photo-grid">
        {selected.map((photo, index) => (
          <button
            type="button"
            key={photo.src}
            aria-label={`Open ${photo.caption}`}
            onClick={(event) => {
              const image = event.currentTarget.querySelector("img");
              lightbox.open(
                selected.map((entry, at) => ({
                  ...entry,
                  previewSrc:
                    at === index ? image?.currentSrc || entry.src : entry.src,
                  thumbnailSrc: entry.src,
                  origin:
                    at === index
                      ? image
                      : document.querySelector<HTMLImageElement>(
                          `[data-gallery-image="${entry.src}"]`,
                        ),
                })),
                index,
              );
            }}
          >
            <Image
              data-gallery-image={photo.src}
              src={photo.src}
              alt={photo.alt}
              width={1600}
              height={1200}
              loading="lazy"
              sizes="(max-width: 640px) 80vw, 500px"
            />
            <span className="photo-open">
              <Icon name="lightbox" size={17} />
            </span>
          </button>
        ))}
      </div>
      <p className="demo-hint">Open a photograph. Scroll, swipe, and zoom.</p>
    </div>
  );
}

export function CarouselDemo({
  autoplay = false,
  compact = false,
}: {
  autoplay?: boolean;
  compact?: boolean;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const { ref, carousel, state } = useCarousel({
    loop: true,
    align: "center",
    autoplay: autoplay ? 3500 : undefined,
  });
  const viewer = useLightbox({
    className: "site-lightbox",
    icons: lightboxIcons,
  });
  return (
    <div className={`carousel-demo ${compact ? "carousel-compact" : ""}`}>
      <section
        ref={ref}
        className="reuse-carousel photo-carousel"
        aria-label="Landscape photographs"
      >
        {photos.map((photo, index) => (
          <button
            data-carousel-slide=""
            type="button"
            key={photo.src}
            className="reuse-carousel__slide photo-slide"
            aria-label={`Open ${photo.caption}`}
            onClick={(event) => {
              viewer.open(
                photos.map((entry, at) => ({
                  ...entry,
                  previewSrc:
                    at === index
                      ? event.currentTarget.querySelector("img")?.currentSrc ||
                        entry.src
                      : entry.src,
                  origin:
                    at === index
                      ? event.currentTarget.querySelector("img")
                      : null,
                })),
                index,
              );
            }}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              width={1600}
              height={1200}
              loading="lazy"
              sizes="(max-width: 640px) 80vw, 500px"
            />
            <span>{photo.caption}</span>
          </button>
        ))}
      </section>
      <fieldset
        className="carousel-controls"
        onMouseEnter={() => carousel?.hold("controls", true)}
        onMouseLeave={() => carousel?.hold("controls", false)}
        onFocus={() => carousel?.hold("controls-focus", true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            carousel?.hold("controls-focus", false);
        }}
      >
        <legend className="sr-only">Carousel controls</legend>
        <span className="carousel-caption">
          {state.count ? String(state.index + 1).padStart(2, "0") : "01"}
          <span> / {String(photos.length).padStart(2, "0")}</span>
        </span>
        <fieldset
          className="carousel-dots"
          style={{ "--carousel-active": state.index } as CSSProperties}
        >
          <legend className="sr-only">Choose a slide</legend>
          {photos.map((photo, index) => (
            <button
              type="button"
              key={photo.src}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={state.index === index ? "true" : undefined}
              onClick={() => carousel?.goTo(index)}
            />
          ))}
        </fieldset>
        <div className="carousel-arrows">
          {autoplay ? (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                if (isPaused) carousel?.play();
                else carousel?.pause();
                setIsPaused(!isPaused);
              }}
            >
              {isPaused ? "Play" : "Pause"}
            </button>
          ) : null}
          <button
            type="button"
            className="icon-button"
            aria-label="Previous slide"
            disabled={!state.canPrev}
            onClick={() => carousel?.prev()}
          >
            <Icon name="left" size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Next slide"
            disabled={!state.canNext}
            onClick={() => carousel?.next()}
          >
            <Icon name="right" size={18} />
          </button>
        </div>
      </fieldset>
    </div>
  );
}
