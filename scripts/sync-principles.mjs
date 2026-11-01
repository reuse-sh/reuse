import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const { libraries } = await import(
  new URL("../packages/catalog/dist/index.js", import.meta.url).href
);
const check = process.argv.includes("--check");
const start = "<!-- principles:start -->";
const end = "<!-- principles:end -->";

function list(library) {
  return library.principles
    .map(([title, text]) => `- **${title}.** ${text}`)
    .join("\n");
}

function section(owned) {
  const body =
    owned.length === 1
      ? [list(owned[0])]
      : owned.map((library) => `### ${library.name}\n\n${list(library)}`);
  return [
    start,
    "## Principles",
    "These are the rules the code keeps. An adaptation on any framework keeps them too.",
    ...body,
    end,
  ].join("\n\n");
}

function withSection(readme, text) {
  const from = readme.indexOf(start);
  if (from !== -1) {
    const to = readme.indexOf(end, from);
    if (to === -1) throw new Error(`${start} has no matching ${end}`);
    return readme.slice(0, from) + text + readme.slice(to + end.length);
  }
  const lines = readme.split("\n");
  let at = lines.findIndex((line) => line.startsWith("# ")) + 1;
  while (lines[at] === "") at += 1;
  while (at < lines.length && lines[at] !== "") at += 1;
  lines.splice(at, 0, "", text);
  return lines.join("\n");
}

const stale = [];
const packages = join(root, "packages");
for (const entry of await readdir(packages, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join(packages, entry.name);
  const manifest = JSON.parse(
    await readFile(join(dir, "package.json"), "utf8"),
  );
  const owned = libraries.filter(
    (library) => library.packageName === manifest.name,
  );
  if (manifest.private || owned.length === 0) continue;
  const file = join(dir, "README.md");
  const current = await readFile(file, "utf8");
  const next = withSection(current, section(owned));
  if (next === current) continue;
  if (check) stale.push(relative(root, file));
  else await writeFile(file, next);
}

if (stale.length > 0) {
  for (const file of stale)
    console.error(`${file} is out of date. Run pnpm principles.`);
  process.exit(1);
}
