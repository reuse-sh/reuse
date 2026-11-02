"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { Avatar } from "@reuse-sh/avatars/react";
import "@reuse-sh/annotations/styles.css";
import "@reuse-sh/avatars/styles.css";
import "./mechanics.css";

const photos = [
  {
    id: "lake",
    src: "https://reuse.sh/images/marble-lake.svg",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 1600,
    height: 1200,
  },
  {
    id: "mountains",
    src: "https://reuse.sh/images/marble-mountains.svg",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 1600,
    height: 1200,
  },
  {
    id: "coast",
    src: "https://reuse.sh/images/marble-coast.svg",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 1600,
    height: 1200,
  },
  {
    id: "forest",
    src: "https://reuse.sh/images/marble-forest.svg",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 1600,
    height: 1200,
  },
  {
    id: "night",
    src: "https://reuse.sh/images/marble-night.svg",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 1600,
    height: 1200,
  },
  {
    id: "woods",
    src: "https://reuse.sh/images/marble-woods.svg",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 1600,
    height: 1200,
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
        <header className="re-review-head [display:flex] [align-items:center] [gap:12px] [margin-bottom:18px]">
          <Avatar name="Aiko Tanaka" src={photos[3].src} size={32} />
          <p className="re-review-meta [display:grid] [font-size:14px] [line-height:20px] [color:var(--re-demo-prose)]">
            <span>
              <b>Aiko Tanaka</b> reviewed proof 3 of {proof.caption}
            </span>
            <small>Six notes · Tuesday 14:10</small>
          </p>
        </header>
        <AnnotatedImage
          className="re-annot [--re-annotation-color:#d95746] [--re-annotation-radius:10px] [font-size:13px]"
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
