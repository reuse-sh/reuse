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
  const url = new URL(request.url);
  if (file.endsWith(".html")) {
    if (url.searchParams.get("scripts") === "off")
      code = code.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    else
      code = code.replace(
        /<head>/i,
        `<head><script type="importmap">${JSON.stringify({ imports })}</script>`,
      );
    const embed = url.searchParams.get("embed");
    if (embed === "plain" || embed === "card") {
      const padding = embed === "card" ? 72 : 0;
      code = code.replace(
        "</head>",
        `<style>body{--re-embed-gutter:16px;width:calc(min(680px,100vw - 2 * var(--re-embed-gutter)) - ${padding}px)}@media(min-width:1100px){body{--re-embed-gutter:80px}}</style></head>`,
      );
    }
  }
  if (file.endsWith(".css"))
    code = code
      .replaceAll(/@reuse-sh\/([a-z-]+)\/styles.css/g, "/modules/$1/styles.css")
      .replaceAll("https://reuse.sh/fonts/", "/fonts/");
  const type = file.endsWith(".html")
    ? "text/html"
    : file.endsWith(".css")
      ? "text/css"
      : "text/javascript";
  return new Response(code, {
    headers: { "Content-Type": `${type}; charset=utf-8` },
  });
}
