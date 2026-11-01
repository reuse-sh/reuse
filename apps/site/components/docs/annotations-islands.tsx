"use client";

import { type Annotation, serializeAnnotations } from "@reuse-sh/annotations";
import { AnnotationEditor } from "@reuse-sh/annotations/react";
import { useState } from "react";
import { photos } from "../../lib/photos";

const print = photos[0];

const initial: Annotation[] = [
  { kind: "area", box: [10, 14, 30, 30], label: "Crop line" },
  { kind: "arrow", line: [70, 74, 52, 56] },
];

export function ProofEditor() {
  const [annotations, setAnnotations] = useState(initial);
  const saved = serializeAnnotations(annotations);
  return (
    <div className="x-editor-doc">
      <AnnotationEditor
        className="x-annot x-annot-edit"
        src={print.src}
        alt={`${print.alt}, with editable marks`}
        width={print.width}
        height={print.height}
        annotations={annotations}
        onChange={setAnnotations}
      />
      <div className="x-saved">
        <p className="x-saved-head">
          <b className="x-saved-label">Saved</b>
          <span aria-live="polite">
            {annotations.length === 1
              ? "1 mark"
              : `${annotations.length} marks`}
          </span>
        </p>
        <pre className="x-saved-code">
          <code>{saved}</code>
        </pre>
      </div>
    </div>
  );
}
