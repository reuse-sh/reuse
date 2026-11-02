"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "@reuse-sh/annotations/styles.css";

const initial: Annotation[] = [
  { kind: "area", box: [7, 10, 30, 32], label: "Bands too tight" },
  { kind: "spotlight", box: [56, 50, 28, 32] },
  { kind: "arrow", line: [38, 82, 54, 68] },
  { kind: "line", line: [8, 90, 44, 90] },
  { kind: "pointer", point: [76, 24], label: "Keep this orange", side: "auto" },
  {
    kind: "marker",
    point: [24, 60],
    text: "Lift the <strong>blue</strong> one step",
  },
];
export function Example() {
  const annotations = initial;
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800 [--re-annotation-radius:12px]">
      <header className="mb-6">
        <b>Aiko Tanaka</b>
        <p>Reviewed proof 3 of Mint and ember</p>
        <small className="text-neutral-500">Six notes · Tuesday 14:10</small>
      </header>
      <AnnotatedImage
        src="https://reuse.sh/images/marble-mountains.svg"
        alt="A soft marble texture in mint, blue and orange"
        width={1600}
        height={1200}
        annotations={annotations}
      />
    </div>
  );
}
