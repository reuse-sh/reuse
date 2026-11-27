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
const [lake, mountains, coast, forest, night] = photos;
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
        sizes="(max-width: 48rem) 75vw, 300px"
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
  return (
    <div className="re-example w-full min-w-0">
      <PhotoLightbox className="re-gal grid gap-1.5">
        {[lake, mountains, coast, forest, night].map((photo, index) => (
          <PhotoButton
            key={photo.id}
            photo={photo}
            className={index === 0 ? "re-gal-main row-span-2" : undefined}
          />
        ))}
      </PhotoLightbox>
    </div>
  );
}
