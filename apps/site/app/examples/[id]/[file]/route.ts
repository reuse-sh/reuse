import { exampleFiles } from "../../../../lib/example-source";

const modules = [
  "annotations",
  "avatars",
  "carousel",
  "gradients",
  "interactions",
  "lightbox",
  "loaders",
  "shadows",
];
const imports = Object.fromEntries(
  modules.map((name) => [`@reuse-sh/${name}`, `/modules/${name}/index.js`]),
);
imports["@reuse-sh/core/escape-html"] = "/modules/core/escape-html.js";
imports["@reuse-sh/core/clipboard"] = "/modules/core/clipboard.js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; file: string }> },
) {
  const { id, file } = await params;
  const files = await exampleFiles(id);
  const source = files?.find(
    (entry) => entry.name === file && /\.(html|css|js)$/.test(entry.name),
  );
  if (!source) return new Response("Not found", { status: 404 });
  let code = source.code;
  if (file.endsWith(".html")) {
    if (new URL(request.url).searchParams.get("scripts") === "off")
      code = code.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    else
      code = code.replace(
        /<head>/i,
        `<head><script type="importmap">${JSON.stringify({ imports })}</script>`,
      );
  }
  if (file.endsWith(".css"))
    code = code.replaceAll(
      /@reuse-sh\/([a-z-]+)\/styles.css/g,
      "/modules/$1/styles.css",
    );
  const type = file.endsWith(".html")
    ? "text/html"
    : file.endsWith(".css")
      ? "text/css"
      : "text/javascript";
  return new Response(code, {
    headers: { "Content-Type": `${type}; charset=utf-8` },
  });
}
