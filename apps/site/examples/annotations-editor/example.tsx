"use client";
import { type Annotation, serializeAnnotations } from "@reuse-sh/annotations";
import { AnnotationEditor } from "@reuse-sh/annotations/react";
import { useState } from "react";
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

const print = photos[0];

const initial: Annotation[] = [
  { kind: "area", box: [10, 14, 30, 30], label: "Crop line" },
  { kind: "arrow", line: [70, 74, 52, 56] },
];

export function Example() {
  const [annotations, setAnnotations] = useState(initial);
  const saved = serializeAnnotations(annotations);
  return (
    <div className="re-example re-editor-doc grid gap-5">
      <AnnotationEditor
        className="re-annot text-label re-annot-edit"
        src={print.src}
        alt={`${print.alt}, with editable marks`}
        width={print.width}
        height={print.height}
        annotations={annotations}
        onChange={setAnnotations}
      />
      <div className="re-saved overflow-hidden rounded-control bg-card shadow-raised">
        <p className="re-saved-head flex justify-between px-3.5 pt-2.5 text-caption text-subtle-foreground">
          <b className="re-saved-label text-foreground font-semibold">Saved</b>
          <span aria-live="polite">
            {annotations.length === 1
              ? "1 mark"
              : `${annotations.length} marks`}
          </span>
        </p>
        <pre className="re-saved-code my-3 max-h-36 px-3.5 pt-2 pb-3.5 overflow-auto font-mono text-caption whitespace-pre-wrap break-all text-muted-foreground">
          <code>{saved}</code>
        </pre>
      </div>
    </div>
  );
}
