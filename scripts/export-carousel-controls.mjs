import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const root = new URL("../", import.meta.url);
const destination = new URL("apps/site/examples/carousel-controls/", root);
const read = (path) => readFile(new URL(path, root), "utf8");
const write = (name, source) => writeFile(new URL(name, destination), source);
const scope = (source) =>
  source
    .replaceAll("cc-", "re-cc-")
    .replaceAll('"cc"', '"re-cc"')
    .replace(/\.cc(?=[\s.{:])/g, ".re-cc")
    .replaceAll("d-dots", "re-cc-dots")
    .replaceAll("--d-dot", "--re-dot")
    .replaceAll("c-seg-fill", "re-cc-seg-fill")
    .replaceAll("c-seg-hover", "re-cc-seg-hover")
    .replaceAll("sr-only", "re-cc-sr-only")
    .replaceAll("--shadow-control", "--re-cc-shadow-control")
    .replaceAll("var(--hover)", "var(--re-cc-hover)")
    .replaceAll("var(--ease)", "var(--re-cc-ui-ease)");
await mkdir(destination, { recursive: true });
const helpers = {
  "carousel-styles.ts": scope(
    (await read("apps/site/components/docs/carousel-styles.ts"))
      .replace('"../../lib/photos"', '"./photos"')
      .replace('"../lucide-arrows"', '"./arrows"')
      .replace('"../segment-highlight"', '"./segment-highlight"'),
  ),
  "segment-highlight.ts": scope(
    await read("apps/site/components/segment-highlight.ts"),
  ),
  "photos.ts": (await read("apps/site/lib/photos.ts")).replace(
    "`/images/",
    "`https://reuse.sh/images/",
  ),
  "arrows.ts": (await read("apps/site/components/lucide-arrows.tsx")).split(
    "export type ArrowName",
  )[0],
};
for (const [name, source] of Object.entries(helpers)) {
  await write(name, source);
  await write(
    name.replace(/\.ts$/, ".js"),
    stripTypeScriptTypes(source).replace(
      /from "(\.\/[^".]+)"/g,
      'from "$1.js"',
    ),
  );
}
const docs = await read("apps/site/app/styles/docs.css");
const controls = docs
  .split("/* Carousel control styles */")[1]
  .split("/* Demos of the libraries")[0];
const dots = docs.slice(docs.indexOf(".d-dots {"), docs.indexOf(".d-arrows {"));
await write(
  "styles.css",
  `@import "@reuse-sh/carousel/styles.css";\n@import "@reuse-sh/interactions/styles.css";
@font-face {font-family:Geist;src:url("https://reuse.sh/fonts/geist.woff2") format("woff2");font-weight:100 900;font-display:swap;}
.re-cc {
  --re-cc-shadow-control: 0 0 0 .5px rgb(0 0 0 / 8%), 0 1px 2px rgb(0 0 0 / 5%), 0 2px 4px rgb(0 0 0 / 2%);
  --re-cc-hover: rgb(0 0 0 / 3%);
  --re-cc-ui-ease: cubic-bezier(0.23, 1, 0.32, 1);
  font: inherit;
  font-size: 15px;
  line-height: 24px;
  width: 100%;
}
.re-cc *, .re-cc *::before, .re-cc *::after { box-sizing: border-box; }
.re-cc button, .re-cc input { font: inherit; }
.re-cc img, .re-cc svg { display: block; }
.re-cc p { margin-bottom: 0; }
.re-cc-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
${scope(dots + controls)}
`,
);
const photosModule = await import(new URL("photos.js", destination));
const photos = photosModule.photos;
const stylesModule = helpers["carousel-styles.ts"];
const styles = Function(
  `return ${stylesModule.split("export const carouselStyles = ")[1].split("] as const;")[0]}]`,
)();
const slides = photos
  .map(
    (photo) =>
      `<figure class="re-cc-slide re-carousel__slide" data-carousel-slide><img src="${photo.src}" alt="${photo.alt}" width="1600" height="1200" draggable="false"></figure>`,
  )
  .join("\n");
await write(
  "index.html",
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Carousel controls</title><link rel="stylesheet" href="./styles.css"></head><body style="margin:0;font:15px/24px Geist,system-ui,sans-serif;letter-spacing:-0.006em">
<section class="re-cc">
<fieldset class="re-cc-seg" disabled><legend class="re-cc-sr-only">Carousel control style</legend>
${styles.map((style, index) => `<label class="re-cc-seg-item" data-re-row${index === 0 ? ' data-current=""' : ""}><input type="radio" name="re-cc-style" class="re-cc-sr-only" value="${style.name}"${index === 0 ? " checked" : ""}>${style.name}</label>`).join("\n")}
</fieldset>
<div class="re-cc-demo"><div class="re-cc-c re-cc-c-dots"><div class="re-cc-view re-carousel">${slides}</div></div></div>
<p class="re-cc-note"><b>Dots.</b> ${styles[0].note}</p>
</section><script type="module" src="./main.js"></script></body></html>`,
);
await write(
  "main.js",
  `import { carouselStyles, mountCarouselStyle } from "./carousel-styles.js";
import { createSegmentHighlights } from "./segment-highlight.js";
const root = document.querySelector(".re-cc");
const group = root.querySelector("fieldset");
const demo = root.querySelector(".re-cc-demo");
const note = root.querySelector(".re-cc-note");
let destroy = mountCarouselStyle(demo, "Dots");
group.disabled = false;
const unhighlight = createSegmentHighlights(group);
function change(event) {
  const input = event.target;
  const style = carouselStyles.find((entry) => entry.name === input.value);
  if (!style) return;
  destroy();
  destroy = mountCarouselStyle(demo, style.name);
  for (const label of group.querySelectorAll("label")) label.toggleAttribute("data-current", label.contains(input));
  const title = document.createElement("b");
  title.textContent = \`\${style.name}.\`;
  note.replaceChildren(title, \` \${style.note}\`);
  input.parentElement.scrollIntoView({ block: "nearest", inline: "nearest" });
}
group.addEventListener("change", change);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  destroy();
  unhighlight();
  group.disabled = true;
  group.removeEventListener("change", change);
  window.removeEventListener("pagehide", cleanup);
});
`,
);
await write(
  "example.tsx",
  `"use client";
import { useEffect, useId, useRef, useState } from "react";
import { carouselStyles, mountCarouselStyle } from "./carousel-styles";
import { createSegmentHighlights } from "./segment-highlight";
import { photos } from "./photos";
import "./styles.css";
export function Example() {
 const [index, setIndex] = useState(0);
 const [ready, setReady] = useState(false);
 const name = useId();
 const group = useRef<HTMLFieldSetElement>(null);
 const demo = useRef<HTMLDivElement>(null);
 const style = carouselStyles[index];
 useEffect(() => {
   if (!group.current) return;
   setReady(true);
   return createSegmentHighlights(group.current);
 }, []);
 useEffect(() => {
   const node = demo.current;
   if (!node) return;
   return mountCarouselStyle(node, style.name);
 }, [style.name]);
 return <section className="re-cc flex min-w-0 flex-col text-[15px] leading-6">
 <fieldset ref={group} disabled={!ready} className="re-cc-seg flex max-w-full gap-0.5 overflow-x-auto rounded-full border-0 p-[3px]">
 <legend className="re-cc-sr-only">Carousel control style</legend>
 {carouselStyles.map((entry, at) => <label key={entry.name} className="re-cc-seg-item relative inline-flex shrink-0 items-center whitespace-nowrap" data-re-row data-current={at === index ? "" : undefined}>
 <input type="radio" name={name} className="re-cc-sr-only" checked={at === index} onChange={(event) => { setIndex(at); event.currentTarget.parentElement?.scrollIntoView({ block: "nearest", inline: "nearest" }); }} />{entry.name}</label>)}
 </fieldset>
 <div ref={demo} className="re-cc-demo"><div className="re-cc-c re-cc-c-dots"><div className="re-cc-view re-carousel">{photos.map((photo) => <figure key={photo.id} className="re-cc-slide re-carousel__slide" data-carousel-slide>
 {/* biome-ignore lint/performance/noImgElement: standalone recipe uses native images. */}
 <img src={photo.src} alt={photo.alt} width={1600} height={1200} draggable={false}/></figure>)}</div></div></div>
 <p className="re-cc-note max-w-[60ch] text-sm leading-[22px]"><b>{style.name}.</b> {style.note}</p>
 </section>;
}
`,
);
execFileSync(
  "pnpm",
  ["exec", "biome", "check", "--write", "apps/site/examples/carousel-controls"],
  { cwd: root, stdio: "inherit" },
);
process.stdout.write(
  "Exported all eight carousel control styles with complete React and native helpers.\n",
);
