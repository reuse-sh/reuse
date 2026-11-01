"use client";

import {
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { type AnnotationTool, createAnnotationEditor } from "./editor.js";
import {
  type AnnotatedImageOptions,
  annotationImageHtml,
  createAnnotatedImage,
} from "./index.js";
import {
  ANNOTATION_KINDS,
  type Annotation,
  type PointerSide,
} from "./model.js";

export interface AnnotatedImageProps
  extends AnnotatedImageOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {}

export function AnnotatedImage({
  src,
  alt,
  width,
  height,
  annotations,
  ...props
}: AnnotatedImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const controller = useRef<ReturnType<typeof createAnnotatedImage> | null>(
    null,
  );
  const id = useId();
  const [initialHtml] = useState(() =>
    annotationImageHtml({
      src,
      alt,
      width,
      height,
      annotations,
      id: `re-image-${id.replace(/[^\w-]/g, "")}`,
    }),
  );
  useEffect(() => {
    if (!ref.current) return;
    const options = { src, alt, width, height, annotations };
    if (controller.current) controller.current.update(options);
    else controller.current = createAnnotatedImage(ref.current, options);
  });
  useEffect(
    () => () => {
      controller.current?.destroy();
      controller.current = null;
    },
    [],
  );
  return (
    <div
      {...props}
      ref={ref}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: annotationImageHtml validates annotations and escapes attributes through the shared renderer.
      dangerouslySetInnerHTML={{ __html: initialHtml }}
    />
  );
}

const TOOL_LABELS: Record<AnnotationTool, string> = {
  select: "Select",
  area: "Area",
  spotlight: "Spotlight",
  arrow: "Arrow",
  line: "Line",
  pointer: "Pointer",
  marker: "Marker",
};
export interface AnnotationEditorProps
  extends Omit<AnnotatedImageProps, "onChange"> {
  onChange: (annotations: Annotation[]) => void;
  tool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  toolLabels?: Partial<Record<AnnotationTool, ReactNode>>;
}

export function AnnotationEditor({
  src,
  alt,
  width,
  height,
  annotations,
  onChange,
  tool,
  onToolChange,
  toolLabels,
  className,
  ...props
}: AnnotationEditorProps) {
  const root = useRef<HTMLElement>(null);
  const controller = useRef<ReturnType<typeof createAnnotationEditor> | null>(
    null,
  );
  const [localTool, setLocalTool] = useState<AnnotationTool>("select");
  const [selection, setSelection] = useState<number | null>(null);
  const activeTool = tool ?? localTool;
  const latest = useRef({
    annotations,
    activeTool,
    onChange,
    onToolChange,
    isControlled: tool !== undefined,
  });
  latest.current = {
    annotations,
    activeTool,
    onChange,
    onToolChange,
    isControlled: tool !== undefined,
  };
  useEffect(() => {
    if (!root.current) return;
    controller.current = createAnnotationEditor(root.current, {
      annotations: latest.current.annotations,
      tool: latest.current.activeTool,
      onChange: (next) => latest.current.onChange(next),
      onSelectionChange: setSelection,
      onToolChange: (next) => {
        if (!latest.current.isControlled) setLocalTool(next);
        latest.current.onToolChange?.(next);
      },
    });
    return () => {
      controller.current?.destroy();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    controller.current?.setAnnotations(annotations);
  }, [annotations]);
  useEffect(() => {
    controller.current?.setTool(activeTool);
  }, [activeTool]);
  const chooseTool = (next: AnnotationTool) => {
    if (tool === undefined) setLocalTool(next);
    onToolChange?.(next);
  };
  const selected = selection === null ? undefined : annotations[selection];
  const textValue =
    selected?.kind === "marker"
      ? selected.text
      : selected && "label" in selected
        ? selected.label
        : "";
  const [draft, setDraft] = useState("");
  useEffect(() => {
    setDraft(selection === null ? "" : textValue);
  }, [selection, textValue]);
  return (
    <div
      {...props}
      className={["re-annotation-editor", className].filter(Boolean).join(" ")}
    >
      <fieldset className="re-annotation-toolbar" aria-label="Annotation tools">
        {(["select", ...ANNOTATION_KINDS] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            aria-label={TOOL_LABELS[kind]}
            aria-pressed={activeTool === kind}
            onClick={() => chooseTool(kind)}
          >
            {toolLabels?.[kind] ?? TOOL_LABELS[kind]}
          </button>
        ))}
        <button type="button" onClick={() => controller.current?.undo()}>
          Undo
        </button>
        <button type="button" onClick={() => controller.current?.redo()}>
          Redo
        </button>
        <button
          type="button"
          disabled={selection === null}
          onClick={() => controller.current?.removeSelection()}
        >
          Delete
        </button>
      </fieldset>
      <section ref={root} aria-label="Edit image annotations">
        <AnnotatedImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          annotations={annotations}
        />
      </section>
      {selected &&
        (selected.kind === "marker" ||
          selected.kind === "pointer" ||
          selected.kind === "area") && (
          <div className="re-annotation-fields">
            <label>
              {selected.kind === "marker" ? "Marker text" : "Label"}
              <input
                value={draft}
                maxLength={selected.kind === "marker" ? 300 : 120}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={() => {
                  controller.current?.updateSelection(
                    selected.kind === "marker"
                      ? { text: draft }
                      : { label: draft },
                  );
                  setDraft(textValue);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </label>
            {selected.kind === "pointer" && (
              <label>
                Label position
                <select
                  value={selected.side}
                  onChange={(event) =>
                    controller.current?.updateSelection({
                      side: event.target.value as PointerSide,
                    })
                  }
                >
                  <option value="auto">Automatic</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="top">Above</option>
                  <option value="bottom">Below</option>
                </select>
              </label>
            )}
          </div>
        )}
      <p className="re-annotation-editor-hint">
        Choose a tool, then click or drag on the image. Select a mark to move
        it. Arrow keys move the selection, Delete removes it, and Escape
        cancels.
      </p>
    </div>
  );
}
