"use client";
import "./mechanics.css";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";

const photos = [
  {
    id: "lake",
    src: "/images/marble-lake.webp",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 2400,
    height: 1800,
  },
  {
    id: "mountains",
    src: "/images/marble-mountains.webp",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 2400,
    height: 1800,
  },
  {
    id: "coast",
    src: "/images/marble-coast.webp",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 2400,
    height: 1800,
  },
  {
    id: "forest",
    src: "/images/marble-forest.webp",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 2400,
    height: 1800,
  },
  {
    id: "night",
    src: "/images/marble-night.webp",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 2400,
    height: 1800,
  },
  {
    id: "woods",
    src: "/images/marble-woods.webp",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 2400,
    height: 1800,
  },
];

const initial: Annotation[] = [
  { kind: "area", box: [12, 19, 32, 36], label: "A quieter corner" },
  { kind: "arrow", line: [70, 68, 48, 50] },
  {
    kind: "marker",
    point: [76, 26],
    text: "Keep <strong>context</strong> beside the image.",
  },
];

export function Example() {
  return (
    <div className="re-example w-full min-w-0 text-label">
      <AnnotatedImage
        className="re-annot"
        src={photos[0].src}
        alt={`${photos[0].alt}, with three annotations`}
        width={2400}
        height={1800}
        annotations={initial}
      />
    </div>
  );
}
