import { docSections, findLibrary, libraries } from "@reuse-sh/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CodeCard, CopyControl } from "../../../components/copy-control";
import { Icon } from "../../../components/icons";
import { LibraryDemo } from "../../../components/library-demo";
import { LibraryShell } from "../../../components/library-shell";
import { libraryGuide, snippets } from "../../../lib/guides";

export const dynamicParams = false;
export function generateStaticParams() {
  return libraries.flatMap((library) =>
    docSections.map((section) => ({
      library: library.slug,
      section: section.slug,
    })),
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ library: string; section: string }>;
}): Promise<Metadata> {
  const values = await params;
  return {
    title: `${findLibrary(values.library)?.name ?? ""} / ${docSections.find((section) => section.slug === values.section)?.title ?? ""}`,
  };
}
export default async function DocumentationPage({
  params,
}: {
  params: Promise<{ library: string; section: string }>;
}) {
  const values = await params;
  const library = findLibrary(values.library);
  const section = docSections.find(
    (section) => section.slug === values.section,
  );
  if (!library || !section) notFound();
  const example = snippets[library.slug];
  return (
    <LibraryShell library={library}>
      <header className="library-header">
        <p className="eyebrow">{library.name}</p>
        <h1>{section.title}</h1>
        <p>
          {section.slug === "getting-started"
            ? "Bring one implementation into your project."
            : section.slug === "examples"
              ? "The actual components, ready to try."
              : section.slug === "api"
                ? "A small interface around the work that repeats."
                : "The behavior to preserve when you adapt the component."}
        </p>
        <div className="library-header-actions">
          <CopyControl
            value={libraryGuide(library)}
            label="Copy agent guide"
            text
          />
          <a className="text-link" href={`/${library.slug}/guide.md`}>
            Markdown <Icon name="arrow" size={13} />
          </a>
        </div>
      </header>
      {section.slug === "getting-started" ? (
        <div className="doc-body">
          <p>
            Use <code>{library.packageName}</code> for the browser
            implementation. React adapters are separate entry points and use the
            same mechanics.
          </p>
          <p className="workspace-note">
            These packages are currently local to this workspace. They have not
            been published to npm. Read the source or add the workspace package
            to your project before using these imports.
          </p>
          <h2>Browser JavaScript</h2>
          <CodeCard code={example.native} />
          <h2>React</h2>
          <CodeCard code={example.react} />
          <h2>Keep ownership clear</h2>
          <p>
            The library owns its listeners, animation work, and measured
            geometry. Your project owns its content, design, and application
            actions. Call destroy when the owning surface is removed.
          </p>
        </div>
      ) : null}
      {section.slug === "api" ? (
        <div className="doc-body">
          <div className="api-list">
            {library.api.map((api) => (
              <div key={api}>{api}</div>
            ))}
          </div>
          <h2>Integration notes</h2>
          <ul>
            {library.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <h2>Source of truth</h2>
          <p>
            The exported TypeScript types in{" "}
            <code>
              {library.packageName.replace("@reuse-sh/", "packages/")}/src
            </code>{" "}
            describe options and return values. Read them before adapting an
            integration.
          </p>
          {library.slug === "annotations" ? (
            <>
              <h2>Version 1 document</h2>
              <CodeCard
                code={
                  '{\n  "version": 1,\n  "annotations": [{\n    "kind": "area",\n    "box": [10, 20, 35, 25],\n    "label": "The part to notice"\n  }]\n}'
                }
              />
              <p>
                Box coordinates mean left, top, width, and height as
                percentages. Point coordinates are x and y. Line coordinates are
                x1, y1, x2, and y2. Marker text allows strong, em, and code.
                Unsupported document versions throw, while invalid individual
                annotations are discarded.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
      {section.slug === "behavior" ? (
        <div className="doc-body">
          <h2>Expected behavior</h2>
          <ul>
            {library.features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <h2>Boundaries</h2>
          <ul>
            {library.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <h2>Check the integration</h2>
          <p>
            Try empty and one-item states, repeated input, a narrow container,
            keyboard access, loading failures, and removal while work is
            pending. For moving content, check reduced motion and interruption.
            Record which browsers and devices were actually tested.
          </p>
          <p>
            A working example does not replace checking the component in its
            consuming project.
          </p>
        </div>
      ) : null}
      {section.slug === "examples" ? (
        <>
          <div className="library-demo-frame">
            <LibraryDemo slug={library.slug} examples />
          </div>
          {["lightbox", "carousel"].includes(library.slug) ? (
            <div className="doc-body">
              <h2>Plain JavaScript</h2>
              <p>This example loads the same native modules without React.</p>
              <iframe
                className="native-example"
                title="Native JavaScript carousel and lightbox"
                src="/examples/native.html"
              />
              <p>
                <a href="/examples/native.html">Open the standalone example</a>
              </p>
            </div>
          ) : null}
          {library.slug === "loaders" ? (
            <div className="doc-body">
              <h2>Morphing sequence</h2>
              <LibraryDemo slug="loaders" />
              <p>
                The default sequence transitions between figures. A single
                preset keeps its own motion. The public timeline and sampler are
                the same functions used by the canvas controller.
              </p>
            </div>
          ) : null}
        </>
      ) : null}
      <div className="library-reading-link">
        <Link className="text-link" href={`/${library.slug}`}>
          Back to {library.name}
        </Link>
      </div>
    </LibraryShell>
  );
}
