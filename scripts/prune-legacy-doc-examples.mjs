import { execFileSync } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(
  new URL("../apps/site/package.json", import.meta.url),
);
const babel = require("next/dist/compiled/babel/core");
const t = babel.types;
const root = new URL("../", import.meta.url);
const active = {
  "lightbox-pages.tsx": ["LightboxOverview", "LightboxMedia"],
  "carousel-pages.tsx": ["CarouselOverview"],
  "tooltip-pages.tsx": ["TooltipOverview"],
  "annotations-pages.tsx": ["AnnotationsDataFormat"],
  "gradients-pages.tsx": ["GradientsCurves"],
};
for (const [name, keep] of Object.entries(active)) {
  const file = new URL(`apps/site/components/docs/${name}`, root);
  const source = await readFile(file, "utf8");
  const result = babel.transformSync(source, {
    filename: name,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: ["typescript", "jsx"] },
    plugins: [
      () => ({
        visitor: {
          ExportNamedDeclaration(path) {
            if (
              t.isFunctionDeclaration(path.node.declaration) &&
              !keep.includes(path.node.declaration.id.name)
            )
              path.remove();
          },
          JSXExpressionContainer(path) {
            const expression = path.node.expression;
            if (
              t.isLogicalExpression(expression, { operator: "??" }) &&
              t.isIdentifier(expression.left, { name: "example" })
            )
              path.node.expression = expression.left;
            if (
              t.isConditionalExpression(expression) &&
              t.isUnaryExpression(expression.test, { operator: "!" }) &&
              t.isIdentifier(expression.test.argument, { name: "example" })
            )
              path.remove();
          },
          Program: {
            exit(path) {
              let changed;
              do {
                changed = false;
                path.scope.crawl();
                for (const statement of path.get("body")) {
                  if (statement.isFunctionDeclaration()) {
                    const binding = path.scope.getBinding(
                      statement.node.id.name,
                    );
                    if (binding && !binding.referenced) {
                      statement.remove();
                      changed = true;
                    }
                  } else if (statement.isVariableDeclaration()) {
                    for (const declaration of statement.get("declarations")) {
                      const ids = Object.keys(
                        t.getBindingIdentifiers(declaration.node.id),
                      );
                      if (
                        ids.length &&
                        ids.every(
                          (id) => !path.scope.getBinding(id)?.referenced,
                        )
                      ) {
                        declaration.remove();
                        changed = true;
                      } else if (t.isArrayPattern(declaration.node.id)) {
                        const elements = declaration.node.id.elements;
                        elements.forEach((element, index) => {
                          if (
                            t.isIdentifier(element) &&
                            !path.scope.getBinding(element.name)?.referenced
                          ) {
                            elements[index] = null;
                            changed = true;
                          }
                        });
                        while (elements.length && elements.at(-1) === null)
                          elements.pop();
                      }
                    }
                  } else if (
                    statement.isImportDeclaration() &&
                    statement.node.specifiers.length
                  ) {
                    for (const specifier of statement.get("specifiers"))
                      if (
                        statement.node.importKind !== "type" &&
                        specifier.node.importKind !== "type" &&
                        !path.scope.getBinding(specifier.node.local.name)
                          ?.referenced
                      ) {
                        specifier.remove();
                        changed = true;
                      }
                    if (!statement.node.specifiers.length) statement.remove();
                  }
                }
              } while (changed);
            },
          },
        },
      }),
    ],
  });
  await writeFile(file, `${result.code}\n`);
}
for (const name of [
  "avatars-pages.tsx",
  "copy-pages.tsx",
  "hold-islands.tsx",
  "loaders-islands.tsx",
  "highlight-islands.tsx",
  "carousel-controls.tsx",
  "example-code.ts",
])
  await rm(new URL(`apps/site/components/docs/${name}`, root), { force: true });

const basicFile = new URL("apps/site/components/docs/basic-code.ts", root);
const basic = babel.transformSync(await readFile(basicFile, "utf8"), {
  filename: "basic-code.ts",
  configFile: false,
  babelrc: false,
  comments: false,
  parserOpts: { plugins: ["typescript"] },
  plugins: [
    () => ({
      visitor: {
        VariableDeclarator(path) {
          if (
            t.isIdentifier(path.node.id, { name: "basicCode" }) &&
            t.isObjectExpression(path.node.init)
          )
            path.node.init.properties = path.node.init.properties.filter(
              (property) =>
                t.isObjectProperty(property) &&
                (property.key.name === "curves" ||
                  property.key.value === "curves"),
            );
        },
      },
    }),
  ],
});
await writeFile(basicFile, `${basic.code}\n`);

async function sources(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = new URL(
      entry.name + (entry.isDirectory() ? "/" : ""),
      directory,
    );
    if (entry.isDirectory()) output.push(...(await sources(file)));
    else if (/\.tsx?$/.test(entry.name))
      output.push(await readFile(file, "utf8"));
  }
  return output;
}
const used = (await sources(new URL("apps/site/components/", root)))
  .concat(await sources(new URL("apps/site/app/", root)))
  .join("\n");
const postcss = require("postcss");
const file = new URL("apps/site/app/styles/docs.css", root);
const css = postcss.parse(await readFile(file, "utf8"));
let removed = 0;
css.walkRules((rule) => {
  const classes = [...rule.selector.matchAll(/\.(x-[\w-]+)/g)].map(
    (match) => match[1],
  );
  if (classes.length && classes.every((name) => !used.includes(name))) {
    rule.remove();
    removed++;
  }
});
css.walkAtRules("media", (rule) => {
  if (!rule.nodes.length) rule.remove();
});
await writeFile(file, css.toString());
execFileSync(
  "pnpm",
  [
    "exec",
    "biome",
    "check",
    "--write",
    ...Object.keys(active).map((name) => `apps/site/components/docs/${name}`),
    "apps/site/components/docs/basic-code.ts",
    "apps/site/app/styles/docs.css",
  ],
  { cwd: root, stdio: "inherit" },
);
process.stdout.write(`Removed ${removed} unused legacy example style rules.\n`);
