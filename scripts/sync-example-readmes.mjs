import { readFile, writeFile } from "node:fs/promises";
import {
  getUsage,
  libraries,
  usageMarkdown,
} from "../packages/catalog/dist/index.js";

const groups = new Map();
for (const library of libraries) {
  const name = library.packageName.split("/")[1];
  if (!groups.has(name)) groups.set(name, []);
  groups.get(name).push(library);
}
const check = process.argv.includes("--check");
let drift = false;
for (const [name, owned] of groups) {
  const file = new URL(`../packages/${name}/README.md`, import.meta.url);
  const original = await readFile(file, "utf8");
  const entries = owned.map((library) => {
    const react = getUsage(library.slug, "getting-started", "react");
    const html = getUsage(library.slug, "getting-started", "html");
    if (!react || !html) throw new Error(`Missing usage for ${library.slug}`);
    return [
      ...(owned.length > 1 ? [`### ${library.name}`] : []),
      `[Documentation](https://reuse.sh/${library.slug}/getting-started)`,
      `${owned.length > 1 ? "####" : "###"} React`,
      usageMarkdown(react, 4),
      `${owned.length > 1 ? "####" : "###"} HTML + JavaScript`,
      usageMarkdown(html, 4),
    ].join("\n\n");
  });
  const section = `<!-- examples:start -->\n\n## Usage\n\n${entries.join("\n\n")}\n\n<!-- examples:end -->\n\n`;
  const start = original.indexOf("<!-- examples:start -->");
  const end = original.indexOf("## Documentation", start);
  if (start < 0 || end < 0)
    throw new Error(`Missing example marker in ${name}.`);
  const next = original.slice(0, start) + section + original.slice(end);
  if (next !== original) {
    if (check) {
      process.stderr.write(`Example guidance differs in ${name}.\n`);
      drift = true;
    } else await writeFile(file, next);
  }
}
if (drift) process.exitCode = 1;
else process.stdout.write("Package example guidance is consistent.\n");
