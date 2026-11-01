import { docHref, docPages, findLibrary } from "@reuse-sh/catalog";
import { notFound, permanentRedirect } from "next/navigation";
import { libraryParams } from "../../../components/docs/doc-route";

export const dynamicParams = false;
export const generateStaticParams = libraryParams;
export default async function Examples({
  params,
}: {
  params: Promise<{ library: string }>;
}) {
  const library = findLibrary((await params).library);
  if (!library) notFound();
  const first = docPages(library).find((page) =>
    page.path.startsWith("examples/"),
  );
  permanentRedirect(docHref(library, first?.path ?? ""));
}
