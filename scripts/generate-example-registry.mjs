import { execFileSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";

const directory = new URL("../apps/site/examples/", import.meta.url);
const ids = (await readdir(directory, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const imports = ids.map(
  (id, index) =>
    `import { Example as Example${index} } from "../examples/${id}/example";`,
);
const entries = ids.map((id, index) => `  "${id}": Example${index},`);
const destination = new URL(
  "../apps/site/lib/example-registry.tsx",
  import.meta.url,
);
const source = `import type { ComponentType } from "react";\n${imports.join("\n")}\n\nexport const examples: Record<string, ComponentType> = {\n${entries.join("\n")}\n};\n`;
const formatted = execFileSync(
  "pnpm",
  ["exec", "biome", "format", "--stdin-file-path=example-registry.tsx"],
  { input: source, encoding: "utf8" },
);
const previous = await readFile(destination, "utf8").catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return undefined;
});
if (previous !== formatted) await writeFile(destination, formatted);
process.stdout.write(`Registered ${ids.length} showcases.\n`);
