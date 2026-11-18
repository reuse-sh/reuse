"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { Avatar } from "@reuse-sh/avatars/react";
import "./mechanics.css";

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

const proof = photos[1];

const review: Annotation[] = [
  { kind: "area", box: [7, 10, 30, 32], label: "Bands too tight" },
  { kind: "spotlight", box: [56, 50, 28, 32] },
  { kind: "arrow", line: [38, 82, 54, 68] },
  { kind: "line", line: [8, 90, 44, 90] },
  {
    kind: "pointer",
    point: [76, 24],
    label: "Keep this orange",
    side: "auto",
  },
  {
    kind: "marker",
    point: [24, 60],
    text: "Lift the <strong>blue</strong> one step",
  },
];

export function Example() {
  return (
    <div className="re-example w-full min-w-0">
      <article className="re-review">
        <header className="re-review-head flex items-center gap-3 mb-4.5">
          <Avatar name="Aiko Tanaka" src={photos[3].src} size={32} />
          <p className="re-review-meta grid text-ui text-muted-foreground">
            <span>
              <b>Aiko Tanaka</b> reviewed proof 3 of {proof.caption}
            </span>
            <small>Six notes · Tuesday 14:10</small>
          </p>
        </header>
        <AnnotatedImage
          className="re-annot text-label"
          src={proof.src}
          alt={`${proof.alt}, with six review notes`}
          width={proof.width}
          height={proof.height}
          annotations={review}
        />
      </article>
    </div>
  );
}
