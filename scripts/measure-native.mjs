import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const names = [
  "carousel",
  "lightbox",
  "annotations",
  "loaders",
  "interactions",
  "avatars",
  "shadows",
];
const results = [];
for (const name of names) {
  const files = new Map();
  const visit = async (file) => {
    if (files.has(file)) return;
    const source = await readFile(file, "utf8");
    files.set(file, source);
    if (/\bimport\s*\(/.test(source))
      throw new Error(
        `Dynamic native imports need an explicit measurement path: ${file}`,
      );
    const imports = source.matchAll(
      /\b(?:import|export)\s+(?:(?:[^;]*?)\s+from\s+)?["']([^"']+)["']/g,
    );
    for (const match of imports) {
      const specifier = match[1];
      if (specifier.startsWith("."))
        await visit(resolve(dirname(file), specifier));
      else {
        assert.ok(
          specifier.startsWith("@reuse-sh/"),
          `External runtime import: ${specifier}`,
        );
        const [dependency, ...path] = specifier
          .slice("@reuse-sh/".length)
          .split("/");
        await visit(
          resolve(
            root,
            "packages",
            dependency,
            "dist",
            path.length ? `${path.join("/")}.js` : "index.js",
          ),
        );
      }
    }
  };
  const entry = resolve(root, "packages", name, "dist/index.js");
  await visit(entry);
  await import(pathToFileURL(entry).href);
  results.push({
    name,
    modules: files.size,
    bytes: [...files.values()].reduce(
      (sum, source) => sum + Buffer.byteLength(source),
      0,
    ),
    gzipBytes: [...files.values()].reduce(
      (sum, source) => sum + gzipSync(source).length,
      0,
    ),
  });
}
console.table(results);
await writeFile(
  resolve(root, "docs/native-sizes.json"),
  `${JSON.stringify({ measured: "2026-11-01", method: "Sum of individually gzipped, unminified native ESM modules reachable from each entry. Includes shared internal dependencies. Excludes CSS, React adapters, images, and fonts. No external runtime imports allowed.", results }, null, 2)}\n`,
);
