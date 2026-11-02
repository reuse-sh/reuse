import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const requireSite = createRequire(join(root, "apps/site/package.json"));
const swc = requireSite("next/dist/build/swc");

export function validateClasses(value) {
  const invalid = [];
  for (const token of value.split(/\s+/).filter(Boolean)) {
    let depth = 0,
      last = -1;
    for (let index = 0; index < token.length; index++) {
      if (token[index] === "[") depth++;
      else if (token[index] === "]") depth--;
      else if (token[index] === ":" && depth === 0) last = index;
    }
    const utility = token.slice(last + 1);
    if (
      /^c-/.test(utility) ||
      utility.includes("[") ||
      /(?:^|:)(?:min|max)-\[/.test(token)
    )
      invalid.push(token);
  }
  return invalid;
}
function strings(node, output) {
  if (!node || typeof node !== "object") return;
  if (node.type === "StringLiteral") output.push([node.value, node.span.start]);
  if (node.type === "TemplateLiteral")
    for (const part of node.quasis)
      output.push([part.cooked ?? part.raw, node.span.start]);
  for (const value of Object.values(node))
    if (Array.isArray(value))
      value.forEach((child) => {
        strings(child, output);
      });
    else if (value && typeof value === "object") strings(value, output);
}
export async function inspectSource(source, filename) {
  await swc.loadBindings();
  const ast = await swc.parse(source, { filename });
  const candidates = [];
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "JSXAttribute" && node.name?.value === "className")
      strings(node.value, candidates);
    if (
      node.type === "KeyValueProperty" &&
      ["className", "highlightClassName", "tooltipClassName"].includes(
        node.key?.value,
      )
    )
      strings(node.value, candidates);
    if (
      node.type === "AssignmentExpression" &&
      node.left?.property?.value === "className"
    )
      strings(node.right, candidates);
    if (
      node.type === "CallExpression" &&
      ["cn", "cva"].includes(node.callee?.value)
    )
      strings(node.arguments, candidates);
    for (const value of Object.values(node))
      if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object") walk(value);
  }
  walk(ast);
  return [
    ...new Set(
      candidates.flatMap(([value, position]) =>
        validateClasses(value).map(
          (token) =>
            `${
              Buffer.from(source)
                .subarray(0, position - 1)
                .toString()
                .split("\n").length
            }: ${token}`,
        ),
      ),
    ),
  ];
}
async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      entry.name.startsWith(".") ||
      entry.name === "node_modules" ||
      entry.name === "public"
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (/\.(?:tsx?|css)$/.test(entry.name)) result.push(path);
  }
  return result;
}
async function main() {
  const errors = [];
  const all = await files(join(root, "apps/site"));
  for (const file of all) {
    const source = await readFile(file, "utf8");
    if (file.endsWith(".css")) {
      for (const match of source.matchAll(/@apply\s+([^;]+);/g))
        for (const token of validateClasses(match[1]))
          errors.push(`${relative(root, file)}: ${token}`);
      if (/\.c-[\w-]+/.test(source))
        errors.push(`${relative(root, file)}: legacy c-* selector`);
    } else
      for (const error of await inspectSource(source, file))
        errors.push(`${relative(root, file)}:${error}`);
  }
  if (errors.length) {
    process.stderr.write(`${errors.join("\n")}\n`);
    process.exitCode = 1;
  } else
    process.stdout.write(
      `Semantic design-system check passed for ${all.length} source files.\n`,
    );
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
