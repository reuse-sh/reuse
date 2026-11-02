import { exampleFiles, readExample } from "../../source";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  if (process.env.NODE_ENV !== "development")
    return new Response(null, { status: 404 });
  const { file } = await params;
  const name = exampleFiles.find((entry) => entry === file);
  if (!name || name === "print-carousel.tsx")
    return new Response(null, { status: 404 });
  let code = await readExample(name);
  if (name === "index.html") {
    if (new URL(request.url).searchParams.get("scripts") === "off") {
      code = code.replace(
        '<script type="module" src="./main.js"></script>',
        "",
      );
    } else {
      code = code.replace(
        '<script type="module"',
        '<script type="importmap">{"imports":{"@reuse-sh/carousel":"/modules/carousel/index.js"}}</script><script type="module"',
      );
    }
  }
  if (name === "styles.css") {
    code = code.replace(
      "@reuse-sh/carousel/styles.css",
      "/modules/carousel/styles.css",
    );
  }
  const contentType = {
    "index.html": "text/html",
    "styles.css": "text/css",
    "main.js": "text/javascript",
  }[name];
  return new Response(code, {
    headers: { "Content-Type": `${contentType}; charset=utf-8` },
  });
}
