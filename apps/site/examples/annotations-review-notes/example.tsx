"use client";
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "./mechanics.css";
import { photo } from "@/lib/photos";

const page = photo("reuse-settings-page");

const notes: Annotation[] = [
  { kind: "area", box: [72, 49, 19.5, 26], label: "Right-aligned" },
  { kind: "marker", point: [39.2, 25.5], text: "Copy a prompt for your agent" },
  {
    kind: "pointer",
    point: [93, 85.5],
    label: "Press and hold",
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
