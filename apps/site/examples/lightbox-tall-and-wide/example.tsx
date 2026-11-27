"use client";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type Photo, photo } from "@/lib/photos";
import { cn } from "@/lib/utils";

const screenshot = photo("reuse-api-page");
const tile = photo("re-tile");
const drawing = photo("quiet-hills");
const panorama = photo("horizon");

function Shape({
  photo,
  format,
  sizes,
  className,
  linkClassName,
  imageClassName,
  ratio,
}: {
  photo: Photo;
  format: string;
  sizes: string;
  className?: string;
  linkClassName?: string;
  imageClassName: string;
  ratio?: number;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <a
        href={photo.src}
        data-lightbox-caption={photo.caption}
        className={cn(
          "relative block overflow-hidden rounded-control bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          linkClassName,
        )}
        style={ratio ? { aspectRatio: ratio } : undefined}
      >
        <Picture
          photo={photo}
          sizes={sizes}
          loading="lazy"
          className={imageClassName}
        />
      </a>
      <p className="flex flex-wrap items-baseline gap-x-2 text-ui leading-5">
        <span className="font-medium text-foreground">{photo.caption}</span>
        <span className="text-caption text-subtle-foreground">
          {format},{" "}
          <span className="whitespace-nowrap">
            {photo.width} × {photo.height}
          </span>
        </span>
      </p>
    </div>
  );
}

export function Example() {
  const root = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({});
  useEffect(() => {
    if (root.current) return bindLightboxGallery(root.current, lightbox);
  }, [lightbox]);
  return (
    <div
      ref={root}
      className="mx-auto grid w-full max-w-2xl min-w-0 grid-cols-2 gap-x-3 gap-y-5 max-sm:gap-x-2"
    >
      <Shape
        photo={screenshot}
        format="JPEG"
        sizes="(max-width: 40rem) 45vw, 330px"
        className="row-span-2"
        linkClassName="min-h-0 flex-1"
        imageClassName="absolute inset-0 size-full object-cover object-top"
      />
      <Shape
        photo={tile}
        format="PNG"
        sizes="(max-width: 40rem) 45vw, 330px"
        linkClassName="aspect-square"
        imageClassName="size-full object-contain"
      />
      <Shape
        photo={drawing}
        format="SVG"
        sizes="(max-width: 40rem) 45vw, 330px"
        ratio={drawing.width / drawing.height}
        imageClassName="size-full object-cover"
      />
      <Shape
        photo={panorama}
        format="JPEG"
        sizes="(max-width: 42rem) 100vw, 672px"
        className="col-span-2"
        ratio={panorama.width / panorama.height}
        imageClassName="size-full object-cover"
      />
    </div>
  );
}
