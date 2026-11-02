import { findLibrary, libraries } from "@reuse-sh/catalog";
import { libraryGuide } from "../../../lib/guides";
export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return libraries.map((library) => ({ library: library.slug }));
}
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ library: string }> },
) {
  const library = findLibrary((await params).library);
  return new Response(library ? await libraryGuide(library) : "Not found", {
    status: library ? 200 : 404,
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
