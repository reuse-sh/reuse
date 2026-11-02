"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "@reuse-sh/annotations/styles.css";

const initial: Annotation[] = [
  { kind: "area", box: [8, 12, 30, 34], label: "Bands too tight" },
  { kind: "pointer", point: [74, 24], label: "Keep this orange", side: "auto" },
  { kind: "marker", point: [24, 62], text: "Lift the <strong>blue</strong>" },
];
export function Example() {
  const annotations = initial;
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800 [--re-annotation-radius:12px]">
      <AnnotatedImage
        src="https://reuse.sh/images/marble-lake.svg"
        alt="A soft marble texture in coral, sand and blue"
        width={1600}
        height={1200}
        annotations={annotations}
      />
    </div>
  );
}
