"use client";
import {
  type Annotation,
  annotationsToHtml,
  parseAnnotations,
  serializeAnnotations,
} from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import "@reuse-sh/annotations/styles.css";

const initial: Annotation[] = [
  { kind: "area", box: [8, 12, 30, 34], label: "Bands too tight" },
  { kind: "pointer", point: [74, 24], label: "Keep this orange", side: "auto" },
  { kind: "marker", point: [24, 62], text: "Lift the <strong>blue</strong>" },
];
export function Example() {
  const annotations = parseAnnotations(serializeAnnotations(initial));
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800 [--re-annotation-radius:12px]">
      <h2 className="mb-5 font-serif text-3xl">The document</h2>
      <p className="mb-6">
        Coordinates are percentages of the image. Serialize the versioned
        document and parse it before rendering.
      </p>
      <AnnotatedImage
        src="https://reuse.sh/images/marble-lake.svg"
        alt="A soft marble texture in coral, sand and blue"
        width={1600}
        height={1200}
        annotations={annotations}
      />
      <pre className="mt-4 overflow-auto rounded-xl bg-neutral-100 p-4 text-xs whitespace-pre-wrap break-all">
        {serializeAnnotations(annotations)}
      </pre>
      <h2 className="my-5 font-serif text-3xl">HTML transport</h2>
      <pre className="overflow-auto rounded-xl bg-neutral-100 p-4 text-xs whitespace-pre-wrap break-all">
        {annotationsToHtml(annotations)}
      </pre>
    </div>
  );
}
