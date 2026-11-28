"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
import { Picture } from "@/components/picture";
import { photo } from "@/lib/photos";
import "./sheet.css";

const roll = (
  [
    "white-court",
    "white-arc",
    "garden-wall",
    "steel-wave",
    "concrete-blocks",
    "blue-corner",
    "quiet-stair",
    "pink-tower",
    "glass-tower",
    "balconies",
    "white-grid",
    "shadow-wall",
    "lone-pine",
    "misty-forest",
    "cloud-peak",
    "blue-ridges",
    "green-hill",
    "pink-summit",
    "beach-palm",
    "dunes",
    "open-sea",
    "golden-calm",
    "horizon",
    "sailboat",
    "sea-and-sky",
    "shoreline",
    "dusk-beach",
    "table-still-life",
    "monstera",
    "green-sprig",
    "cube-and-squash",
    "yellow-bloom",
    "arch-room",
    "grey-lounge",
    "empty-room",
    "snow-walk",
    "rock-edge",
    "fog-road",
  ] as const
).map(photo);
const frames = Array.from({ length: 60 }, (_, index) => ({
  number: index + 1,
  photo: roll[index % roll.length],
}));

export function Example() {
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const viewer = useLightbox({
    thumbnails: "side",
    controls: { slideshow: true },
  });
  const items = frames.map(({ number, photo: p }, index) => ({
    src: p.src,
    srcset: p.srcSet,
    alt: p.alt,
    caption: `Frame ${number}, ${p.caption}`,
    width: p.width,
    height: p.height,
    thumbnailSrc: p.srcSet?.split(" ")[0] ?? p.src,
    origin: () => tiles.current[index] ?? null,
  }));
  return (
    <ol
      className="re-contact-sheet grid w-full gap-x-1.5 gap-y-2"
      aria-label="Contact sheet"
    >
      {frames.map(({ number, photo: p }, index) => (
        <li key={number} className="min-w-0">
          <button
            ref={(tile) => {
              tiles.current[index] = tile;
            }}
            type="button"
            className="block w-full cursor-zoom-in rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={`Open frame ${number}, ${p.caption}`}
            onClick={() => viewer.open(items, index)}
          >
            <Picture
              photo={p}
              className="block aspect-square w-full rounded-control bg-media object-cover"
              sizes="(max-width: 48rem) 25vw, 96px"
              alt=""
              loading="lazy"
            />
          </button>
          <span
            className="mt-1 block text-caption text-subtle-foreground tabular-nums"
            aria-hidden="true"
          >
            {number}
          </span>
        </li>
      ))}
    </ol>
  );
}
