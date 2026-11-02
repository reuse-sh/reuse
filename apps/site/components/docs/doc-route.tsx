import {
  docHref,
  docParams,
  findDocPage,
  findLibrary,
  getUsage,
  libraries,
} from "@reuse-sh/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { recipeId } from "../../lib/example-manifest";
import { type DocSearch, frameworkFrom } from "../../lib/framework";
import { SiteFrame } from "../site-frame";
import { DocActions } from "./doc-actions";
import { ExamplePanel } from "./example-panel";
import { FrameworkChooser } from "./framework-chooser";
import { GettingStarted } from "./getting-started";
import { LibraryFrame } from "./library-frame";
import { Install, Pager, PageTitle, Section } from "./parts";
import { docBody } from "./registry";
import { UsageContent } from "./usage-content";

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
  const example = id ? <ExamplePanel id={id} /> : null;
  const sections = path ? getUsage(slug, path, framework) : undefined;
  const body =
    path === "getting-started" ? (
      <GettingStarted library={found.library} framework={framework} />
    ) : sections ? (
      <>
        {path.startsWith("examples/") || path.startsWith("guides/")
          ? example
          : null}
        <Section title="Install">
          <Install library={found.library} />
        </Section>
        <UsageContent sections={sections} />
      </>
    ) : (
      docBody(found.library, path, path === "" ? example : undefined)
    );
  return (
    <SiteFrame framework={framework}>
      <LibraryFrame
        slug={slug}
        before={<FrameworkChooser framework={framework} pathname={pathname} />}
      >
        <PageTitle
          title={path ? found.page.title : found.library.name}
          lead={found.page.lead}
        >
          <DocActions library={found.library} path={path} />
        </PageTitle>
        <article className="space-y-10" data-slot="doc-content">
          {body}
        </article>
        <Pager library={found.library} path={path} />
      </LibraryFrame>
    </SiteFrame>
  );
}
