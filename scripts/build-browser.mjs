import { readdir, readFile, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import { gzipSync } from "node:zlib";
import { rolldown } from "rolldown";

const name = basename(process.cwd());
const { entries, budgets } = JSON.parse(
  await readFile(new URL("browser-builds.json", import.meta.url), "utf8"),
)[name];
const manifest = JSON.parse(await readFile("package.json", "utf8"));
const out = "dist/browser";

await rm(out, { recursive: true, force: true });
const bundle = await rolldown({ input: entries, platform: "browser" });
await bundle.write({
  dir: out,
  format: "es",
  minify: true,
  sourcemap: true,
  entryFileNames: "[name].js",
  postBanner: `/*! ${manifest.name} ${manifest.version} | MIT License */`,
});
await bundle.close();

const over = [];
for (const file of (await readdir(out)).filter((file) =>
  file.endsWith(".js"),
)) {
  const size = gzipSync(await readFile(join(out, file))).length / 1024;
  const budget = budgets[file];
  const line = `${manifest.name}/browser/${file}: ${size.toFixed(2)} KB gzip, budget ${budget ?? "none"}`;
  console.log(line);
  if (!(size <= budget)) over.push(line);
}
if (over.length > 0) {
  console.error(
    `Over the size budget in scripts/browser-builds.json (1 KB = 1024 bytes):\n${over.join("\n")}`,
  );
  process.exit(1);
}
