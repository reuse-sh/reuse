import { notFound } from "next/navigation";
import { examples } from "../../lib/example-registry";
import { Stage } from "./parts";

const unframed = [
  "carousel-controls",
  "loaders-figures",
  "shadows-scale",
  "gradients-easing-curves",
];
const edgeToEdge = ["lightbox-product", "lightbox-journal", "lightbox-chat"];
const narrow = ["lightbox-chat"];
const stageClass: Record<string, string> = {
  "tooltip-shortcuts": "overflow-hidden p-0",
  "annotations-review-notes": "max-sm:p-4",
};

export function ExamplePanel({ id }: { id: string }) {
  const Component = examples[id];
  if (!Component) notFound();
  return (
    <section
      data-slot="example-preview"
      aria-label="Example"
      className={narrow.includes(id) ? "mx-auto w-full max-w-sm" : undefined}
      data-re-tooltip-scope={id.startsWith("tooltip-") ? "" : undefined}
    >
      {unframed.includes(id) ? (
        <Component />
      ) : (
        <Stage
          className={
            edgeToEdge.includes(id)
              ? "content-stretch gap-0 overflow-hidden rounded-panel p-0"
              : stageClass[id]
          }
        >
          <Component />
        </Stage>
      )}
    </section>
  );
}
