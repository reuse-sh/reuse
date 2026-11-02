"use client";
import { type Annotation, serializeAnnotations } from "@reuse-sh/annotations";
import { AnnotationEditor } from "@reuse-sh/annotations/react";
import { useState } from "react";
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

const print = photos[0];

const initial: Annotation[] = [
  { kind: "area", box: [10, 14, 30, 30], label: "Crop line" },
  { kind: "arrow", line: [70, 74, 52, 56] },
];

export function Example() {
  const [annotations, setAnnotations] = useState(initial);
  const saved = serializeAnnotations(annotations);
  return (
    <div className="re-example re-editor-doc [display:grid] [gap:20px]">
      <AnnotationEditor
        className="re-annot [--re-annotation-color:#d95746] [--re-annotation-radius:10px] [font-size:13px] re-annot-edit"
        src={print.src}
        alt={`${print.alt}, with editable marks`}
        width={print.width}
        height={print.height}
        annotations={annotations}
        onChange={setAnnotations}
      />
      <div className="re-saved [overflow:hidden] [border-radius:12px] [background:var(--re-demo-surface)] [box-shadow:var(--re-demo-shadow-raised)]">
        <p className="re-saved-head [display:flex] [justify-content:space-between] [padding:10px_14px_0] [font-size:12.5px] [color:var(--re-demo-mute)]">
          <b className="re-saved-label [color:var(--re-demo-ink)] [font-weight:560]">
            Saved
          </b>
          <span aria-live="polite">
            {annotations.length === 1
              ? "1 mark"
              : `${annotations.length} marks`}
          </span>
        </p>
        <pre className="re-saved-code my-3 [max-height:140px] [padding:8px_14px_14px] [overflow:auto] [font-family:var(--re-demo-mono)] [font-size:12px] [line-height:19px] [white-space:pre-wrap] [word-break:break-all] [color:var(--re-demo-prose)]">
          <code>{saved}</code>
        </pre>
      </div>
    </div>
  );
}
