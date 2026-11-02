import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { type CodeLang, highlight } from "../components/shell/highlight";

const directory = join(process.cwd(), "examples");

export const exampleIds = cache(async () =>
  (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name),
);

export const exampleFiles = cache(async (id: string) => {
  if (!(await exampleIds()).includes(id)) return null;
  const names = (await readdir(join(directory, id))).filter((name) =>
    /\.(?:tsx?|jsx?|css|html)$/.test(name),
  );
  return Promise.all(
    names.map(async (name) => ({
      name,
      code: await readFile(join(directory, id, name), "utf8"),
    })),
  );
});

export async function highlightedFiles(
  id: string,
  framework: "react" | "html",
) {
  const files = await exampleFiles(id);
  if (!files) return null;
  return files
    .filter((file) =>
      framework === "react"
        ? /\.(?:tsx|ts)$/.test(file.name) ||
          (file.name.endsWith(".css") &&
            files.some(
              (source) =>
                /\.(?:tsx|ts)$/.test(source.name) &&
                source.code.includes(`./${file.name}`),
            ))
        : !/\.(?:tsx|ts)$/.test(file.name),
    )
    .sort((a, b) => {
      const order = ["example.tsx", "index.html", "styles.css", "main.js"];
      const rank = (name: string) => {
        const index = order.indexOf(name);
        return index < 0 ? order.length : index;
      };
      return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
    })
    .map((file) => {
      const extension = file.name.split(".").at(-1);
      const lang: CodeLang =
        extension === "tsx"
          ? "tsx"
          : extension === "html"
            ? "html"
            : extension === "css"
              ? "css"
              : "ts";
      return { ...file, runs: highlight(file.code, lang) };
    });
}
