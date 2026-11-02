import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = resolve(root, "apps/site/public");
const modules = resolve(publicDirectory, "modules");
await rm(modules, { recursive: true, force: true });
for (const name of [
  "core",
  "carousel",
  "lightbox",
  "annotations",
  "loaders",
  "interactions",
  "avatars",
  "shadows",
  "gradients",
]) {
  const directory = resolve(modules, name);
  await mkdir(directory, { recursive: true });
  for (const entry of await readdir(resolve(root, "packages", name, "dist"))) {
    if (
      (!entry.endsWith(".js") && !entry.endsWith(".css")) ||
      entry.startsWith("react")
    )
      continue;
    await copyFile(
      resolve(root, "packages", name, "dist", entry),
      resolve(directory, entry),
    );
  }
}
const fontDirectory = resolve(publicDirectory, "fonts");
await mkdir(fontDirectory, { recursive: true });
await copyFile(
  resolve(
    root,
    "apps/site/node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  ),
  resolve(fontDirectory, "geist.woff2"),
);
await copyFile(
  resolve(
    root,
    "apps/site/node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  ),
  resolve(fontDirectory, "geist-mono.woff2"),
);
await copyFile(
  resolve(root, "apps/site/node_modules/geist/LICENSE.txt"),
  resolve(fontDirectory, "OFL.txt"),
).catch(async () => {
  await writeFile(
    resolve(fontDirectory, "OFL.txt"),
    await readFile(resolve(root, "apps/site/node_modules/geist/LICENSE")),
  );
});

const requireSite = createRequire(resolve(root, "apps/site/package.json"));
const postcss = requireSite("postcss");
const tailwind = requireSite("@tailwindcss/postcss");
const stylesheet = resolve(root, "apps/site/app/globals.css");
const result = await postcss([
  tailwind({ base: resolve(root, "apps/site") }),
]).process(await readFile(stylesheet, "utf8"), { from: stylesheet });
const stylesDirectory = resolve(publicDirectory, "styles");
await mkdir(stylesDirectory, { recursive: true });
const fonts =
  '@font-face{font-family:Geist;src:url("/fonts/geist.woff2") format("woff2");font-weight:100 900;font-display:swap;}@font-face{font-family:"Geist Mono";src:url("/fonts/geist-mono.woff2") format("woff2");font-weight:100 900;font-display:swap;}';
await writeFile(resolve(stylesDirectory, "site.css"), fonts + result.css);
