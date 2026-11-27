"use client";
import { createLightbox, type LightboxItem } from "@reuse-sh/lightbox";
import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./mechanics.css";
import { photo } from "@/lib/photos";

const photos = [
  photo("pink-summit"),
  photo("open-sea"),
  photo("dunes"),
  photo("lone-pine"),
  photo("sailboat"),
  photo("cloud-peak"),
];
const [lake, mountains, , forest, night, woods] = photos;
type Photo = (typeof photos)[number];

function PhotoButton({
  photo,
  className,
  hidden,
  children,
}: {
  photo: Photo;
  className?: string;
  hidden?: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      href={photo.src}
      className={cn("re-photo", className)}
      data-photo={photo.id}
      aria-label={`Open ${photo.caption}`}
      hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
    >
      {/* biome-ignore lint/performance/noImgElement: photos are served as is; the lightbox reads the rendered image as its origin. */}
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes="(max-width: 48rem) 100vw, 608px"
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        draggable={false}
      />
      {children}
    </a>
  );
}

function PhotoLightbox({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const lightbox = createLightbox({
      thumbnails: "bottom",
    });
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-photo]");
      if (!trigger || !node.contains(trigger)) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const group = trigger.closest("[data-photo-group]") ?? node;
      const triggers = [...group.querySelectorAll<HTMLElement>("[data-photo]")];
      const items = triggers.map((button): LightboxItem => {
        const photo =
          photos.find((entry) => entry.id === button.dataset.photo) ??
          photos[0];
        const image = button.querySelector("img");
        return {
          src: photo.src,
          srcset: photo.srcSet,
          alt: photo.alt,
          caption: photo.caption,
          width: photo.width,
          height: photo.height,
          thumbnailSrc: photo.src,
          previewSrc: image?.currentSrc || photo.src,
          origin: button.hidden ? null : image,
        };
      });
      lightbox.open(items, triggers.indexOf(trigger));
    };
    node.addEventListener("click", onClick);
    return () => {
      node.removeEventListener("click", onClick);
      lightbox.destroy();
    };
  }, []);
  return (
    <div ref={root} data-gallery="" className={className}>
      {children}
    </div>
  );
}
export function Example() {
  const [hero, a, b, c, d] = [mountains, forest, night, woods, lake];
  return (
    <div className="re-example w-full min-w-0">
      <PhotoLightbox className="re-example">
        <article className="re-journal mt-11" data-photo-group>
          <p className="re-date text-label text-subtle-foreground">
            October 2026 · 5 prints
          </p>
          <h2 className="re-j-title mt-1.5 text-2xl leading-8 font-semibold tracking-tight text-balance">
            One week of early light
          </h2>
          <p className="re-j-text max-w-xl mt-4 text-body leading-7 text-muted-foreground text-pretty">
            Every print in this series starts as an early walk and a single
            frame. The light comes up over the sea or the snow, and the shutter
            keeps it in one long pass.
          </p>
          <figure className="re-j-fig mt-7">
            <PhotoButton
              photo={hero}
              className="re-j-hero w-full aspect-video"
            />
            <figcaption>{hero.caption}</figcaption>
          </figure>
          <div className="re-j-pair grid grid-cols-2 gap-2 mt-7">
            <PhotoButton photo={a} />
            <PhotoButton photo={b} />
          </div>
          <p className="re-j-text max-w-xl mt-4 text-body leading-7 text-muted-foreground text-pretty">
            No two mornings come out alike. We kept the five where the light
            stayed soft, and printed them on matte cotton paper at the size they
            were taken.
          </p>
          <div className="re-j-wide grid gap-2 h-64 max-sm:h-40 mt-7">
            <PhotoButton photo={c} />
            <PhotoButton photo={d} />
          </div>
        </article>
      </PhotoLightbox>
    </div>
  );
}
