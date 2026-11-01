"use client";

import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage, AnnotationEditor } from "@reuse-sh/annotations/react";
import { useState } from "react";
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

export function AnnotationsDemo({ editable = false }: { editable?: boolean }) {
  const [annotations, setAnnotations] = useState(initial);
  return (
    <div className="annotation-demo">
      {editable ? (
        <AnnotationEditor
          src={photos[0].src}
          alt={`${photos[0].alt}, with editable annotations`}
          width={1600}
          height={1200}
          annotations={annotations}
          onChange={setAnnotations}
        />
      ) : (
        <AnnotatedImage
          src={photos[0].src}
          alt={`${photos[0].alt}, with three annotations`}
          width={1600}
          height={1200}
          annotations={initial}
        />
      )}
    </div>
  );
}
