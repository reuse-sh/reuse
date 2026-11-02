import {
  docHref,
  docParams,
  findDocPage,
  findLibrary,
  libraries,
  pagePrompt,
} from "@reuse-sh/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { recipeId } from "../../lib/example-manifest";
import { type DocSearch, frameworkFrom } from "../../lib/framework";
import { SiteFrame } from "../site-frame";
import { ExamplePanel } from "./example-panel";
import { FrameworkChooser } from "./framework-chooser";
import { GettingStarted } from "./getting-started";
import { LibraryFrame } from "./library-frame";
import { AgentPrompt, Pager, PageTitle } from "./parts";
import { docBody } from "./registry";

export type DocParams = Promise<{ library: string; page?: string }>;

function resolve(slug: string, path: string) {
  const library = findLibrary(slug);
  const page = library && findDocPage(library, path);
  return library && page ? { library, page } : null;
}

const pathOf = async (params: DocParams, prefix: string) => {
  const values = await params;
  return { slug: values.library, path: prefix + (values.page ?? "") };
};

export const libraryParams = () =>
  libraries.map((library) => ({ library: library.slug }));

/** Route parameters for the pages under a prefix such as "examples/". */
export const pageParams = (prefix: string) => () => docParams(prefix);

export async function docMetadata(
  params: DocParams,
  prefix: string,
): Promise<Metadata> {
  const { slug, path } = await pathOf(params, prefix);
  const found = resolve(slug, path);
  if (!found) return {};
  const { library, page } = found;
  return {
    title: path ? `${page.title} · ${library.name}` : library.name,
    description: page.lead,
  };
}

export async function DocRoute({
  params,
  prefix,
  searchParams,
}: {
  params: DocParams;
  prefix: string;
  searchParams: Promise<DocSearch>;
}) {
  const { slug, path } = await pathOf(params, prefix);
  const found = resolve(slug, path);
  if (!found) notFound();
  const query = await searchParams;
  const framework = frameworkFrom(query.framework);
  const pathname = docHref(found.library, path);
  const id = recipeId(slug, path || "getting-started");
  const example = id ? (
    <ExamplePanel
      id={id}
      framework={framework}
      pathname={pathname}
      view={query.view === "code" ? "code" : "preview"}
      file={typeof query.file === "string" ? query.file : undefined}
    />
  ) : null;
  const body =
    path === "getting-started" ? (
      <GettingStarted library={found.library} framework={framework}>
        {example}
      </GettingStarted>
    ) : path.startsWith("examples/") ||
      (slug === "carousel" && path === "guides/controls") ? (
      example
    ) : (
      <>
        {docBody(
          found.library,
          path,
          path === "" || slug === "easing-gradients" ? example : undefined,
        )}
        {path === "" || slug === "easing-gradients" ? null : example}
      </>
    );
  const basePrompt = pagePrompt(found.library, path);
  const prompt = basePrompt
    ? `${basePrompt} Use ${framework === "react" ? "React with Tailwind CSS" : "HTML, CSS and JavaScript"}.`
    : null;
  return (
    <SiteFrame framework={framework}>
      <LibraryFrame
        slug={slug}
        before={<FrameworkChooser framework={framework} pathname={pathname} />}
      >
        <PageTitle
          title={path ? found.page.title : found.library.name}
          lead={found.page.lead}
        />
        <div className="d-body">
          {body}
          {prompt ? <AgentPrompt prompt={prompt} /> : null}
        </div>
        <Pager library={found.library} path={path} />
      </LibraryFrame>
    </SiteFrame>
  );
}
