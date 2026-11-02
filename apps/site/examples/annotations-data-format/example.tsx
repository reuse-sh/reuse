"use client";
import {
  type Annotation,
  annotationsToHtml,
  parseAnnotations,
  serializeAnnotations,
} from "@reuse-sh/annotations";

const initial: Annotation[] = [
  { kind: "area", box: [8, 12, 30, 34], label: "Bands too tight" },
  { kind: "pointer", point: [74, 24], label: "Keep this orange", side: "auto" },
  { kind: "marker", point: [24, 62], text: "Lift the <strong>blue</strong>" },
];
export function Example() {
  const annotations = parseAnnotations(serializeAnnotations(initial));
  return (
    <div className="re-example w-full min-w-0">
      <h2 className="mb-4 text-section font-semibold">The document</h2>
      <p className="mb-6">
        Coordinates are percentages of the image. Serialize the versioned
        document and parse it before rendering.
      </p>
      <pre className="mt-4 overflow-auto rounded-xl bg-muted p-4 text-caption whitespace-pre-wrap break-all">
        {serializeAnnotations(annotations)}
      </pre>
      <h2 className="my-4 text-section font-semibold">HTML transport</h2>
      <pre className="overflow-auto rounded-xl bg-muted p-4 text-caption whitespace-pre-wrap break-all">
        {annotationsToHtml(annotations)}
      </pre>
    </div>
  );
}
