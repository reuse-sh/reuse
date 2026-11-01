"use client";

import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { photos } from "../../lib/photos";

const initial: Annotation[] = [
  { kind: "area", box: [12, 19, 32, 36], label: "A quieter corner" },
  { kind: "arrow", line: [70, 68, 48, 50] },
  {
    kind: "marker",
    point: [76, 26],
    text: "Keep <strong>context</strong> beside the image.",
  },
];

export function AnnotationsDemo() {
  return (
    <div className="annotation-demo">
      <AnnotatedImage
        src={photos[0].src}
        alt={`${photos[0].alt}, with three annotations`}
        width={1600}
        height={1200}
        annotations={initial}
      />
    </div>
  );
}
