import { libraries } from "@reuse-sh/catalog";
export const dynamic = "force-static";
export function GET() {
  const text = [
    "# Reuse",
    "Native web libraries and thin React adapters. Original code is MIT. Packages are local and unpublished.",
    "- /agent.md: Integration agreement",
    "- /how-to-use: Workflow",
    ...libraries.map(
      (library) =>
        `- /${library.slug}/guide.md: ${library.name} — ${library.description}`,
    ),
  ].join("\n\n");
  return new Response(`${text}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
