"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "./mechanics.css";
import { photo } from "@/lib/photos";

const page = photo("reuse-settings-page");

const notes: Annotation[] = [
  { kind: "area", box: [72.6, 80.8, 18.4, 9], label: "Hold, don't click" },
  { kind: "marker", point: [39.2, 25.5], text: "Copy a prompt for your agent" },
  {
    kind: "pointer",
    point: [93.5, 52.7],
    label: "Values align right",
    side: "auto",
  },
];

export function Example() {
  return (
    <AnnotatedImage
      className="re-annot re-review-notes text-label"
      src={page.src}
      alt={`${page.alt}, with three notes`}
      width={1280}
      height={1005}
      annotations={notes}
    />
  );
}
