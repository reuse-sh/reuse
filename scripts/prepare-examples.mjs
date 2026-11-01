import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
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
  resolve(root, "apps/site/node_modules/geist/LICENSE.txt"),
  resolve(fontDirectory, "OFL.txt"),
).catch(async () => {
  await writeFile(
    resolve(fontDirectory, "OFL.txt"),
    await readFile(resolve(root, "apps/site/node_modules/geist/LICENSE")),
  );
});
