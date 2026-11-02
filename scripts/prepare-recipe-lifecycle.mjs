import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

const require = createRequire(
  new URL("../apps/site/package.json", import.meta.url),
);
const babel = require("next/dist/compiled/babel/core");
const t = babel.types;
const directory = new URL("../apps/site/examples/", import.meta.url);
let changed = 0;
for (const entry of await readdir(directory, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (
    !(await readdir(new URL(`${entry.name}/`, directory))).includes("main.js")
  )
    continue;
  const file = new URL(`${entry.name}/main.js`, directory);
  const source = await readFile(file, "utf8");
  let modified = false;
  const result = babel.transformSync(source, {
    configFile: false,
    babelrc: false,
    plugins: [
      () => ({
        visitor: {
          CallExpression(path) {
            const call = path.node;
            if (
              !t.isMemberExpression(call.callee) ||
              !t.isIdentifier(call.callee.object, { name: "window" }) ||
              !t.isIdentifier(call.callee.property, {
                name: "addEventListener",
              }) ||
              !t.isStringLiteral(call.arguments[0], { value: "pagehide" }) ||
              !t.isArrowFunctionExpression(call.arguments[1])
            )
              return;
            const callback = call.arguments[1];
            const body = t.isBlockStatement(callback.body)
              ? callback.body.body
              : [t.expressionStatement(callback.body)];
            call.arguments[1] = t.functionExpression(
              t.identifier("cleanup"),
              [t.identifier("event")],
              t.blockStatement([
                t.ifStatement(
                  t.memberExpression(
                    t.identifier("event"),
                    t.identifier("persisted"),
                  ),
                  t.returnStatement(),
                ),
                ...body,
                t.expressionStatement(
                  t.callExpression(
                    t.memberExpression(
                      t.identifier("window"),
                      t.identifier("removeEventListener"),
                    ),
                    [t.stringLiteral("pagehide"), t.identifier("cleanup")],
                  ),
                ),
              ]),
            );
            call.arguments = call.arguments.slice(0, 2);
            modified = true;
          },
        },
      }),
    ],
  });
  if (modified) {
    await writeFile(file, `${result.code}\n`);
    changed++;
  }
}
process.stdout.write(`Updated lifecycle in ${changed} recipes.\n`);
