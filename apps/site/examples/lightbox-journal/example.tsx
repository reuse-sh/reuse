"use client";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type Photo, photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

const sea = photo("open-sea");
const pair = [photo("snow-walk"), photo("pink-summit")];

function PhotoLink({
  photo,
  sizes,
  className,
}: {
  photo: Photo;
  sizes: string;
  className: string;
}) {
  return (
    <a
      href={photo.src}
      className={cn(
        "block overflow-hidden bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      data-lightbox-caption={photo.caption}
    >
      <Picture
        photo={photo}
        sizes={sizes}
        loading="lazy"
        className="size-full object-cover"
      />
    </a>
  );
}

export function Example() {
  const root = useRef<HTMLElement>(null);
  const lightbox = useLightbox({ thumbnails: "bottom" });
  useEffect(() => {
    if (root.current) return bindLightboxGallery(root.current, lightbox);
  }, [lightbox]);
  return (
    <article ref={root} className="w-full min-w-0">
      <PhotoLink
        photo={sea}
        sizes="(max-width: 48rem) 100vw, 720px"
        className="aspect-2/1"
      />
      <div className="p-8 max-sm:p-6">
        <p className="text-label text-subtle-foreground">
          October 2026 · 3 prints
        </p>
        <h2 className="mt-1.5 text-2xl leading-8 font-semibold tracking-tight text-balance">
          One week of soft light
        </h2>
        <p className="mt-4 max-w-xl text-body leading-7 text-muted-foreground text-pretty">
          Every print in this series starts as a walk and a single frame, over
          the sea, the snow or the peaks. We kept the three where the light
          stayed soft.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-0.5">
        {pair.map((print) => (
          <PhotoLink
            key={print.id}
            photo={print}
            sizes="(max-width: 48rem) 50vw, 360px"
            className="aspect-portrait"
          />
        ))}
      </div>
    </article>
  );
}
