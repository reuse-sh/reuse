import Link from "next/link";
import { notFound } from "next/navigation";
import { examples } from "../../lib/example-registry";
import { highlightedFiles } from "../../lib/example-source";
import type { Framework } from "../../lib/framework";
import { CopyControl } from "../copy-control";
import { NativeFrame } from "./native-frame";
import { Stage } from "./parts";

export async function ExamplePanel({
  id,
  framework,
  pathname,
  view = "preview",
  file,
}: {
  id: string;
  framework: Framework;
  pathname: string;
  view?: "preview" | "code";
  file?: string;
}) {
  const Component = examples[id];
  const files = await highlightedFiles(id, framework);
  if (!Component || !files?.length) notFound();
  const unframed = [
    "carousel-controls",
    "loaders-figures",
    "shadows-scale",
    "gradients-easing-curves",
  ].includes(id);
  const preview =
    framework === "react" ? <Component /> : <NativeFrame key={id} id={id} />;
  const active = files.find((source) => source.name === file) ?? files[0];
  const href = (nextView: string, name?: string) => {
    const query = new URLSearchParams({ framework });
    if (nextView === "code") query.set("view", "code");
    if (name) query.set("file", name);
    return `${pathname}?${query}`;
  };
  return (
    <section
      className="re-example-panel"
      aria-label="Example"
      data-re-tooltip-scope={
        view === "preview" && id.startsWith("tooltip-") ? "" : undefined
      }
    >
      <nav className="re-example-tabs" aria-label="Example view">
        {(["preview", "code"] as const).map((tab) => (
          <Link
            key={tab}
            href={href(tab)}
            scroll={false}
            aria-current={tab === view ? "page" : undefined}
          >
            {tab === "preview" ? "Preview" : "Code"}
          </Link>
        ))}
      </nav>
      {view === "preview" ? (
        unframed ? (
          <div className="mt-5">{preview}</div>
        ) : (
          <Stage
            className={
              id === "tooltip-shortcuts" ? "d-stage-editor" : undefined
            }
          >
            {preview}
          </Stage>
        )
      ) : (
        <div className="c-code re-example-source">
          <div className="re-source-header">
            {files.length === 1 ? (
              <span className="re-source-name">{active.name}</span>
            ) : (
              <nav className="re-source-files" aria-label="Example files">
                {files.map((source) => (
                  <Link
                    key={source.name}
                    href={href("code", source.name)}
                    scroll={false}
                    aria-current={
                      source.name === active.name ? "page" : undefined
                    }
                  >
                    {source.name}
                  </Link>
                ))}
              </nav>
            )}
            <CopyControl value={active.code} />
          </div>
          <pre
            className="max-h-[480px] overflow-auto"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrolling code region needs keyboard access.
            tabIndex={0}
          >
            <code>
              {active.runs.map((run, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: immutable syntax tokens do not reorder independently.
                  key={index}
                  style={run.color ? { color: run.color } : undefined}
                >
                  {run.text}
                </span>
              ))}
            </code>
          </pre>
        </div>
      )}
    </section>
  );
}
