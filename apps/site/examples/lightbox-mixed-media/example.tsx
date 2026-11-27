"use client";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { embed } from "@reuse-sh/lightbox/embed";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { video } from "@reuse-sh/lightbox/video";
import { useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type Photo, photo } from "@/lib/photos";

const content = [video(), embed()];

type Clip = {
  type: "video" | "embed";
  href: string;
  poster: string;
  alt: string;
  caption: string;
  badge: string;
};

const pan: Clip = {
  type: "video",
  href: "/videos/horizon-pan.mp4",
  poster: "/videos/horizon-pan.jpg",
  alt: "A slow pan along a calm sea at sunset",
  caption: "Pan along the horizon",
  badge: "0:08",
};
const waves: Clip = {
  type: "embed",
  href: "https://www.youtube.com/watch?v=KBPavXDw8lw",
  poster: "/videos/ocean-waves.jpg",
  alt: "Blue ocean waves seen from above",
  caption: "Waves from above",
  badge: "YouTube",
};

const set: readonly (Photo | Clip)[] = [
  photo("shoreline"),
  pan,
  photo("sailboat"),
  photo("sea-and-sky"),
  waves,
  photo("dusk-beach"),
];

const tile =
  "relative block aspect-4/3 overflow-hidden rounded-control bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const sizes = "(max-width: 40rem) 45vw, 220px";

function ClipTile({ clip }: { clip: Clip }) {
  return (
    <a
      href={clip.href}
      data-lightbox-type={clip.type}
      data-lightbox-caption={clip.caption}
      className={tile}
    >
      {/* biome-ignore lint/performance/noImgElement: the poster is served as is; the lightbox reads the rendered image as its origin. */}
      <img
        src={clip.poster}
        alt={clip.alt}
        width={960}
        height={540}
        loading="lazy"
        draggable={false}
        className="size-full object-cover"
      />
      <span className="absolute start-2 bottom-2 flex h-6 items-center gap-1 rounded-full bg-scrim/60 ps-1.5 pe-2 text-label font-medium text-overlay-foreground">
        <HugeiconsIcon icon={PlayIcon} size={14} strokeWidth={2} />
        {clip.badge}
      </span>
    </a>
  );
}

export function Example() {
  const root = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({ content, thumbnails: "bottom" });
  useEffect(() => {
    if (root.current) return bindLightboxGallery(root.current, lightbox);
  }, [lightbox]);
  return (
    <div
      ref={root}
      className="mx-auto grid w-full max-w-2xl min-w-0 grid-cols-3 gap-2 max-sm:grid-cols-2"
    >
      {set.map((entry) =>
        "type" in entry ? (
          <ClipTile key={entry.href} clip={entry} />
        ) : (
          <a
            key={entry.id}
            href={entry.src}
            data-lightbox-caption={entry.caption}
            className={tile}
          >
            <Picture
              photo={entry}
              sizes={sizes}
              loading="lazy"
              className="size-full object-cover"
            />
          </a>
        ),
      )}
    </div>
  );
}
