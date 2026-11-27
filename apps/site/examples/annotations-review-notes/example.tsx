"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { Avatar } from "@reuse-sh/avatars/react";
import "./mechanics.css";
import { photo } from "@/lib/photos";

const proof = photo("sailboat");

const review: Annotation[] = [
  { kind: "area", box: [7, 10, 30, 32], label: "Horizon too low" },
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
          <Avatar
            name="Aiko Tanaka"
            src="/images/marble-forest.webp"
            size={32}
          />
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
