"use client";

import { useCarousel, useCarouselState } from "@reuse-sh/carousel/react";
import type { LightboxContentContext } from "@reuse-sh/lightbox";
import { connectCarousel } from "@reuse-sh/lightbox/carousel";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { type CSSProperties, useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { Container } from "@/components/ui/container";
import { photoSources, photos } from "../../lib/photos";
import { Icon } from "../icons";

const tileWidths = [640, 1280, 1760];
const strip = [0, 4, 6, 1, 5, 7, 2, 3].map((index) => {
  const photo = photos[index];
  const aspect = photo.width / photo.height;
  return {
    photo,
    tile: {
      ...photo,
      src: `/photos/${photo.id}-640.jpg`,
      srcSet: photoSources(photo.id, "jpg", tileWidths),
      avifSrcSet: photoSources(photo.id, "avif", tileWidths),
    },
    sizes: `calc(min(310px, 72vw) * ${Math.max(1, (aspect * 5) / 4)})`,
  };
});

function fadePreview({ container, image }: LightboxContentContext) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  if (!image.hasAttribute("src") || motion.matches) return;
  const preview = image.cloneNode(false) as HTMLImageElement;
  preview.className = "re-home-photo-preview";
  preview.alt = "";
  preview.setAttribute("aria-hidden", "true");
  preview.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none";
  image.after(preview);
  const load = new AbortController();
  const remove = () => {
    load.abort();
    preview.remove();
  };
  let animation: Animation | undefined;
  const fade = () => {
    if (!image.complete || image.currentSrc !== image.src) return;
    load.abort();
    void image.decode().then(() => {
      if (!preview.isConnected) return;
      animation = preview.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 150,
        easing: "ease-out",
      });
      void animation.finished.then(remove, remove);
    }, remove);
  };
  const observer = new MutationObserver(() => {
    if (container.hasAttribute("data-loading")) return;
    observer.disconnect();
    if (
      image.src === preview.src ||
      !preview.complete ||
      !preview.naturalWidth ||
      container.hasAttribute("data-error") ||
      container.parentElement?.getAttribute("aria-hidden") === "true" ||
      motion.matches
    ) {
      remove();
      return;
    }
    image.addEventListener("load", fade, { signal: load.signal });
    image.addEventListener("error", remove, { signal: load.signal });
    fade();
  });
  observer.observe(container, {
    attributes: true,
    attributeFilter: ["data-loading"],
  });
  return () => {
    observer.disconnect();
    animation?.cancel();
    remove();
  };
}

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
  const lightbox = useLightbox({
    thumbnails: "bottom",
    renderContent: fadePreview,
  });
  useEffect(() => {
    if (carousel) return connectCarousel(lightbox, carousel);
  }, [lightbox, carousel]);
  const open = (index: number) => {
    const format = images.current.some((image) =>
      image?.currentSrc.endsWith(".avif"),
    )
      ? "avif"
      : "jpg";
    lightbox.open(
      strip.map(({ photo }, at) => {
        const image = images.current[at];
        const source =
          image?.complete && image.naturalWidth > 0
            ? image.currentSrc
            : undefined;
        const minimum =
          tileWidths.find((width) => source?.endsWith(`-${width}.${format}`)) ??
          tileWidths[0];
        const candidates = [...tileWidths, photo.width].filter(
          (width) => width >= minimum,
        );
        const fallback = `/photos/${photo.id}-640.${format}`;
        return {
          ...photo,
          src: source || fallback,
          srcset: photoSources(photo.id, format, candidates),
          thumbnailSrc: source || fallback,
          origin: () => images.current[at] ?? null,
        };
      }),
      index,
    );
  };
  return (
    <div
      className="h-strip group mt-7"
      data-dragging={state.isDragging ? "" : undefined}
    >
      <section ref={ref} className="re-carousel h-strip-vp" aria-label="Photos">
        {strip.map(({ photo, tile, sizes }, index) => (
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
              <Picture
                photo={tile}
                ref={(image) => {
                  images.current[index] = image;
                }}
                decoding="async"
                loading="lazy"
                className="size-full object-cover select-none"
                sizes={sizes}
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
          {strip.map(({ photo }, index) => (
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
