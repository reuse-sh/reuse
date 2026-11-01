import { docHref, docPages, libraries } from "@reuse-sh/catalog";
export const dynamic = "force-static";
export function GET() {
  const text = [
    "# Reuse",
    "Native web libraries with thin React adapters, published to npm under the @reuse-sh scope. Original code is MIT.",
    "- /agent.md: Integration agreement",
    "- /for-agents: Agent guides",
    ...libraries.map(
      (library) =>
        `- /${library.slug}/guide.md: ${library.name}. ${library.description}`,
    ),
    "## Library pages",
    ...libraries.flatMap((library) =>
      docPages(library).map(
        (page) =>
          `- ${docHref(library, page.path)}: ${library.name}, ${page.title}`,
      ),
    ),
  ].join("\n\n");
  return new Response(`${text}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
