import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type CodeLang, highlight } from "../../../components/shell/highlight";

export const exampleFiles = [
  "print-carousel.tsx",
  "index.html",
  "styles.css",
  "main.js",
] as const;

export type ExampleFile = (typeof exampleFiles)[number];

export async function readExample(name: ExampleFile) {
  return readFile(
    join(process.cwd(), "app/preview/carousel/example", name),
    "utf8",
  );
}

export async function exampleSource(name: ExampleFile, lang: CodeLang) {
  const code = await readExample(name);
  return { name, code, runs: highlight(code, lang) };
}
