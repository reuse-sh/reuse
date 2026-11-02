import { notFound } from "next/navigation";
import { examples } from "../../lib/example-registry";
import { Stage } from "./parts";
export function ExamplePanel({ id }: { id: string }) {
  const Component = examples[id];
  if (!Component) notFound();
  const unframed = [
    "carousel-controls",
    "loaders-figures",
    "shadows-scale",
    "gradients-easing-curves",
  ].includes(id);
  return (
    <section
      data-slot="example-preview"
      aria-label="Example"
      data-re-tooltip-scope={id.startsWith("tooltip-") ? "" : undefined}
    >
      {unframed ? (
        <Component />
      ) : (
        <Stage
          className={
            id === "tooltip-shortcuts" ? "overflow-hidden p-0" : undefined
          }
        >
          <Component />
        </Stage>
      )}
    </section>
  );
}
