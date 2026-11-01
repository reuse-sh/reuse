import {
  docParams,
  findDocPage,
  findLibrary,
  libraries,
} from "@reuse-sh/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pager, PageTitle } from "./parts";
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
}: {
  params: DocParams;
  prefix: string;
}) {
  const { slug, path } = await pathOf(params, prefix);
  const found = resolve(slug, path);
  const body = found && docBody(found.library, path);
  if (!found || !body) notFound();
  return (
    <>
      <PageTitle
        title={path ? found.page.title : found.library.name}
        lead={found.page.lead}
      />
      <div className="d-body">{body}</div>
      <Pager library={found.library} path={path} />
    </>
  );
}
