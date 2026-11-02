"use client";
import {
  type Annotation,
  type AnnotationTool,
  createAnnotationEditor,
  type PointerSide,
  serializeAnnotations,
} from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";
import { useEffect, useRef, useState } from "react";
import "@reuse-sh/annotations/styles.css";

const initial: Annotation[] = [
  { kind: "area", box: [10, 14, 30, 30], label: "Crop line" },
  { kind: "arrow", line: [70, 74, 52, 56] },
];
const tools: AnnotationTool[] = [
  "select",
  "area",
  "spotlight",
  "arrow",
  "line",
  "pointer",
  "marker",
];
export function Example() {
  const root = useRef<HTMLElement>(null);
  const editor = useRef<ReturnType<typeof createAnnotationEditor> | null>(null);
  const [annotations, setAnnotations] = useState(initial);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<AnnotationTool>("select");
  const [selection, setSelection] = useState<number | null>(null);
  useEffect(() => {
    if (!root.current) return;
    const controller = createAnnotationEditor(root.current, {
      annotations: initial,
      onChange: setAnnotations,
      onSelectionChange: setSelection,
      onToolChange: setTool,
    });
    editor.current = controller;
    setReady(true);
    return () => {
      controller.destroy();
      editor.current = null;
    };
  }, []);
  const selected = selection === null ? undefined : annotations[selection];
  const text =
    selected?.kind === "marker"
      ? selected.text
      : selected && "label" in selected
        ? selected.label
        : "";
  const [draft, setDraft] = useState("");
  useEffect(() => setDraft(text), [text]);
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800 [--re-annotation-radius:12px]">
      <fieldset className="re-annotation-toolbar" aria-label="Annotation tools">
        {tools.map((kind) => (
          <button
            type="button"
            key={kind}
            disabled={!ready}
            aria-pressed={tool === kind}
            onClick={() => editor.current?.setTool(kind)}
          >
            {kind[0].toUpperCase() + kind.slice(1)}
          </button>
        ))}
        <button
          type="button"
          disabled={!ready}
          onClick={() => editor.current?.undo()}
        >
          Undo
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => editor.current?.redo()}
        >
          Redo
        </button>
        <button
          type="button"
          disabled={!ready || selection === null}
          onClick={() => editor.current?.removeSelection()}
        >
          Delete
        </button>
      </fieldset>
      <section ref={root} aria-label="Image annotations">
        <AnnotatedImage
          src="https://reuse.sh/images/marble-lake.svg"
          alt="A soft marble texture in coral, sand and blue"
          width={1600}
          height={1200}
          annotations={annotations}
        />
      </section>
      {selected && (selected.kind === "marker" || "label" in selected) && (
        <label className="mt-4 block">
          {selected.kind === "marker" ? "Marker text" : "Label"}
          <input
            className="mt-2 block w-full rounded-lg border border-neutral-200 p-2"
            maxLength={selected.kind === "marker" ? 300 : 120}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() =>
              editor.current?.updateSelection(
                selected.kind === "marker" ? { text: draft } : { label: draft },
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
        </label>
      )}
      {selected?.kind === "pointer" && (
        <label className="mt-4 block">
          Label position{" "}
          <select
            value={selected.side}
            onChange={(event) =>
              editor.current?.updateSelection({
                side: event.target.value as PointerSide,
              })
            }
          >
            {["auto", "left", "right", "top", "bottom"].map((side) => (
              <option key={side} value={side}>
                {side}
              </option>
            ))}
          </select>
        </label>
      )}
      <p className="my-4 text-sm text-neutral-500">
        Choose a tool, then click or drag on the image. Arrow keys move the
        selection. Delete removes it. Escape cancels. Command or Control Z
        undoes.
      </p>
      <p>
        Saved ·{" "}
        <span aria-live="polite">
          {annotations.length} {annotations.length === 1 ? "mark" : "marks"}
        </span>
      </p>
      <pre className="mt-4 overflow-auto rounded-xl bg-neutral-100 p-4 text-xs whitespace-pre-wrap break-all">
        {serializeAnnotations(annotations)}
      </pre>
    </div>
  );
}
