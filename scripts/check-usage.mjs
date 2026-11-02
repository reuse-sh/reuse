import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { usageRecipes } from "../packages/catalog/dist/index.js";

const root = join(import.meta.dirname, "..");
const directory = await mkdtemp(join(tmpdir(), "reuse-usage-"));
try {
  const paths = {
    react: [join(root, "apps/site/node_modules/@types/react/index.d.ts")],
    "react/jsx-runtime": [
      join(root, "apps/site/node_modules/@types/react/jsx-runtime.d.ts"),
    ],
  };
  for (const name of [
    "lightbox",
    "carousel",
    "annotations",
    "avatars",
    "loaders",
    "interactions",
    "gradients",
    "shadows",
  ]) {
    const manifest = JSON.parse(
      await readFile(join(root, "packages", name, "package.json"), "utf8"),
    );
    for (const [entry, value] of Object.entries(manifest.exports))
      if (typeof value === "object" && value.types)
        paths[`@reuse-sh/${name}${entry === "." ? "" : entry.slice(1)}`] = [
          join(root, "packages", name, value.types),
        ];
  }
  const declarations = join(directory, "styles.d.ts");
  await writeFile(declarations, 'declare module "*.css";');
  const files = [declarations];
  for (const recipe of Object.values(usageRecipes))
    for (const section of recipe.react)
      for (const block of section.blocks)
        if (block.kind === "code" && block.language === "tsx") {
          const file = join(directory, `${block.id}.tsx`);
          await writeFile(file, block.code);
          files.push(file);
        }
  const config = join(directory, "tsconfig.json");
  await writeFile(
    config,
    JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        moduleResolution: "Bundler",
        jsx: "react-jsx",
        strict: true,
        noEmit: true,
        skipLibCheck: true,
        paths,
      },
      files,
    }),
  );
  const check = spawnSync("pnpm", ["exec", "tsc", "-p", config], {
    cwd: root,
    encoding: "utf8",
  });
  if (check.status !== 0) throw new Error(check.stdout + check.stderr);
  process.stdout.write(
    `Published React usage compiled: ${files.length - 1} modules.\n`,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
