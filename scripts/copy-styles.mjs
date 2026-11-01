import { copyFile, readdir } from "node:fs/promises";

for (const file of await readdir("src")) {
  if (file.endsWith(".css")) await copyFile(`src/${file}`, `dist/${file}`);
}
