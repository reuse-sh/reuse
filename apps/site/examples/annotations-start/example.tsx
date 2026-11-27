"use client";
import "./mechanics.css";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { photo } from "@/lib/photos";

const print = photo("pink-summit");

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
        src={print.src}
        alt={`${print.alt}, with three annotations`}
        width={print.width}
        height={print.height}
        annotations={initial}
      />
    </div>
  );
}
