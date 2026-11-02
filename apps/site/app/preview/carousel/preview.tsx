import { findLibrary } from "@reuse-sh/catalog";
import Link from "next/link";
import type { ReactNode } from "react";
import { CopyControl } from "../../../components/copy-control";
import { Pager, PageTitle, Stage } from "../../../components/docs/parts";
import { Icon } from "../../../components/icons";
import { CodeBlock } from "../../../components/shell/code-block";
import type { CodeRun } from "../../../components/shell/highlight";
import { PrintCarousel } from "./example/print-carousel";

type Platform = "react" | "html";
type View = "preview" | "code";

interface SourceFile {
  name: string;
  code: string;
  runs: CodeRun[];
}

function previewHref(
  platform: Platform,
  variant: "disclosure" | "tabs",
  view: View = "preview",
  file?: string,
) {
  const query = new URLSearchParams({
    __v: variant === "tabs" ? "3" : "2",
    framework: platform,
  });
  if (view === "code") query.set("view", view);
  if (file) query.set("file", file);
  return `/preview/carousel?${query}`;
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="c-h3">{title}</h2>
      {children}
    </section>
  );
}

function Inline({ children }: { children: ReactNode }) {
  return <code className="d-inline">{children}</code>;
}

export function Preview({
  platform,
  variant,
  view,
  selectedFile,
  files,
}: {
  platform: Platform;
  variant: "disclosure" | "tabs";
  view: View;
  selectedFile?: string;
  files: SourceFile[];
}) {
  const react = platform === "react";
  const available = files.filter(
    (file) => react === (file.name === "print-carousel.tsx"),
  );
  const active =
    available.find((file) => file.name === selectedFile) ?? available[0];
  const library = findLibrary("carousel");
  if (!library) return null;
  const href = (
    nextPlatform: Platform,
    nextView: View = "preview",
    file?: string,
  ) => previewHref(nextPlatform, variant, nextView, file);
  const demo = (
    <Stage>
      {react ? (
        <PrintCarousel />
      ) : (
        <iframe
          title="HTML and JavaScript carousel"
          src="/preview/carousel/native/index.html"
          className="block h-[270px] w-full border-0"
        />
      )}
    </Stage>
  );
  const code = (
    <div className="c-code re-example-source">
      <div className="re-source-header">
        <nav aria-label="Example files" className="re-source-files">
          {available.map((file) => (
            <Link
              key={file.name}
              href={href(platform, "code", file.name)}
              scroll={false}
              aria-current={active.name === file.name ? "page" : undefined}
              className="re-source-file"
            >
              {file.name}
            </Link>
          ))}
        </nav>
        <CopyControl value={active.code} />
      </div>
      <pre
        className="max-h-[480px] overflow-auto"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrollable source needs keyboard access.
        tabIndex={0}
      >
        <code>
          {active.runs.map((run, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: highlighted source tokens never reorder independently.
              key={index}
              style={run.color ? { color: run.color } : undefined}
            >
              {run.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
  return (
    <>
      <PageTitle title={library.name} lead={library.description} />
      <div className="d-body re-documentation-preview">
        <section aria-label="Carousel example">
          {variant === "tabs" ? (
            <>
              <nav aria-label="Example view" className="re-example-tabs">
                {(["preview", "code"] as const).map((item) => (
                  <Link
                    key={item}
                    href={href(platform, item)}
                    scroll={false}
                    aria-current={view === item ? "page" : undefined}
                  >
                    {item === "preview" ? "Preview" : "Code"}
                  </Link>
                ))}
              </nav>
              {view === "preview" ? demo : code}
              {view === "preview" ? (
                <p className="d-keys">
                  Drag, swipe, or focus the strip and use the arrow keys.
                </p>
              ) : null}
            </>
          ) : (
            <>
              {demo}
              <p className="d-keys">
                Drag, swipe, or focus the strip and use the arrow keys.
              </p>
              <details className="re-example-disclosure" open={view === "code"}>
                <summary>
                  <Icon name="code" size={14} />
                  <span className="re-show-code">View code</span>
                  <span className="re-hide-code">Hide code</span>
                  <Icon name="down" size={12} />
                </summary>
                {code}
              </details>
            </>
          )}
        </section>
        <Section id="installation" title="Installation">
          <p className="mb-4 leading-6 text-(--prose)">
            {react ? (
              <>
                Add the package to a React 19 project with Tailwind CSS 4
                already configured.
              </>
            ) : (
              <>
                Add the package to a project with an ES module bundler, such as
                Vite.
              </>
            )}
          </p>
          <CodeBlock
            tabs={{ code: "npm install @reuse-sh/carousel", lang: "bash" }}
          />
          {react ? (
            <p className="mt-3 text-[13px] leading-6 text-(--prose)">
              Need Tailwind? Follow the{" "}
              <a
                href="https://tailwindcss.com/docs/installation/using-vite"
                className="underline decoration-black/20 underline-offset-4"
                target="_blank"
                rel="noreferrer"
              >
                installation guide
              </a>{" "}
              for your build tool.
            </p>
          ) : null}
        </Section>

        <Section
          id="usage"
          title={react ? "Add the component" : "Add the files"}
        >
          <p className="mb-4 leading-6 text-(--prose)">
            {react ? (
              <>
                Copy{" "}
                <Link
                  href={href(platform, "code")}
                  scroll={false}
                  className="underline decoration-black/20 underline-offset-4"
                >
                  <Inline>print-carousel.tsx</Inline>
                </Link>{" "}
                from the example, then render it where the strip belongs. It
                includes the sample images, styling, controls and package CSS
                import.
              </>
            ) : (
              <>
                Copy{" "}
                <Link
                  href={href(platform, "code")}
                  scroll={false}
                  className="underline decoration-black/20 underline-offset-4"
                >
                  <Inline>index.html</Inline>, <Inline>styles.css</Inline> and{" "}
                  <Inline>main.js</Inline>
                </Link>{" "}
                into the same folder. The HTML links to the stylesheet and loads
                the script as a module.
              </>
            )}
          </p>
          <CodeBlock
            tabs={{
              code: react
                ? 'import { PrintCarousel } from "./print-carousel";\n\nexport default function GalleryPage() {\n  return <PrintCarousel />;\n}'
                : "npm install --save-dev vite\nnpx vite",
              lang: react ? "tsx" : "bash",
            }}
          />
          <p className="mt-4 leading-6 text-(--prose)">
            {react ? (
              <>
                Replace the <Inline>photos</Inline> array with your own images.
                Tailwind styles the example, and{" "}
                <Inline>@reuse-sh/carousel/styles.css</Inline> supplies scroll
                snap.
              </>
            ) : (
              <>
                Replace the images and captions in <Inline>index.html</Inline>.
                Keep the <Inline>re-carousel</Inline> and{" "}
                <Inline>re-carousel__slide</Inline> classes in the initial HTML.
              </>
            )}
          </p>
        </Section>

        <Section id="without-javascript" title="Without JavaScript">
          <p className="leading-6 text-(--prose)">
            {react ? (
              <>
                Server rendering includes the slides, images and captions before
                hydration.
              </>
            ) : (
              <>
                The HTML contains every slide, image and caption before the
                script loads.
              </>
            )}{" "}
            The stylesheet makes the strip scrollable, and each image is an
            ordinary link. Arrow buttons start disabled and become available
            when the controller is ready.
          </p>
          <p className="mt-3 text-[13px] leading-6 text-(--prose)">
            {react
              ? "A client-only React app still needs JavaScript to produce its first HTML. Use server rendering or prerendering when the page must work without it."
              : "Mouse dragging and the live counter need JavaScript. Touch, trackpad scrolling and image links remain native."}
          </p>
        </Section>

        <Section id="behavior" title="Behavior">
          <dl className="grid gap-5 text-[14px] leading-6">
            <div>
              <dt className="font-medium">Keep the browser in charge.</dt>
              <dd className="mt-1 text-(--prose)">
                Touch and trackpad gestures use native scrolling. The focused
                strip handles arrow keys, and a mouse drag does not activate an
                image link.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Stop at the ends.</dt>
              <dd className="mt-1 text-(--prose)">
                This example does not loop. Previous and Next follow the
                controller state, so a button is disabled when there is no slide
                in that direction.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Leave no behavior behind.</dt>
              <dd className="mt-1 text-(--prose)">
                {react
                  ? "The React hook destroys its controller when the component unmounts."
                  : "The script unsubscribes, removes its listeners and destroys the controller when the page leaves without entering the back/forward cache."}{" "}
                Reduced motion skips the spring animation.
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-[13px] text-(--prose)">
            See the{" "}
            <Link
              href="/carousel/api"
              className="underline decoration-black/20 underline-offset-4"
            >
              API reference
            </Link>{" "}
            for grouping, looping, autoplay and controller methods.
          </p>
        </Section>
      </div>
      <Pager library={library} path="" />
    </>
  );
}
