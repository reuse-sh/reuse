import { readFile, writeFile } from "node:fs/promises";
import prefixes from "../apps/site/lib/example-prefixes.json" with {
  type: "json",
};
import { libraries } from "../packages/catalog/dist/index.js";

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
    const id = `${prefixes[library.slug] ?? library.slug}-start`;
    const page = `https://reuse.sh/${library.slug}/getting-started`;
    return [
      ...(owned.length > 1 ? [`### ${library.name}`] : []),
      `The [React example](${page}?view=code) includes its data, Tailwind styling and package CSS imports. Copy \`example.tsx\` into a React 19 project with Tailwind CSS 4, then render \`<Example />\`.`,
      `The [HTML + JavaScript example](${page}?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.`,
      `Runnable browser example: [${id}](https://reuse.sh/examples/${id}/index.html).`,
    ].join("\n\n");
  });
  const section = `<!-- examples:start -->\n\n## Complete examples\n\n${entries.join("\n\n")}\n\n<!-- examples:end -->\n\n`;
  const start = original.includes("<!-- examples:start -->")
    ? original.indexOf("<!-- examples:start -->")
    : original.search(/^## (Browser|CSS|Usage|React|Easing gradient)/m);
  const end = original.indexOf("## Documentation", start);
  if (start < 0 || end < 0)
    throw new Error(`Missing README example section in ${name}.`);
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
