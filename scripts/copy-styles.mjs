import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { dirname } from "node:path";

const order = "@layer re.base, re.theme;";
const layerOf = (file) =>
  file === "base.css"
    ? "re.base"
    : file === "theme.css" || file.startsWith("themes/")
      ? "re.theme"
      : undefined;

const files = await readdir("src", { recursive: true });
for (const file of files.filter((name) => name.endsWith(".css"))) {
  const layer = layerOf(file);
  await mkdir(dirname(`dist/${file}`), { recursive: true });
  if (!layer) {
    await copyFile(`src/${file}`, `dist/${file}`);
    continue;
  }
  const source = await readFile(`src/${file}`, "utf8");
  await writeFile(`dist/${file}`, `${order}\n@layer ${layer} {\n${source}}\n`);
  await mkdir(dirname(`dist/unlayered/${file}`), { recursive: true });
  await copyFile(`src/${file}`, `dist/unlayered/${file}`);
}
