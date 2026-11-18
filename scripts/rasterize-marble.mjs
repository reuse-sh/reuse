// Renders the marble SVGs to WebP files at 1.5 times their declared size. The SVGs blur
// their shapes with feGaussianBlur, which the browser repaints on every frame a photo moves.
import { readdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const SCALE = 1.5;
const QUALITY = 0.95;
const directory = new URL("../apps/site/public/images/", import.meta.url);

const names = (await readdir(directory))
  .filter((name) => /^marble-[a-z]+(-\d+x\d+)?\.svg$/.test(name))
  .sort();
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const name of names) {
    const source = await readFile(new URL(name, directory), "utf8");
    const size = source.match(/width="(\d+)" height="(\d+)"/);
    if (!size) throw new Error(`${name} declares no width and height.`);
    const width = Number(size[1]) * SCALE;
    const height = Number(size[2]) * SCALE;
    const svg = source.replace(size[0], `width="${width}" height="${height}"`);
    const base64 = await page.evaluate(
      async ({ svg, width, height, quality }) => {
        const image = new Image();
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
        const blob = await new Promise((resolve, reject) =>
          canvas.toBlob(
            (result) =>
              result ? resolve(result) : reject(new Error("No WebP encoder")),
            "image/webp",
            quality,
          ),
        );
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        return btoa(binary);
      },
      { svg, width, height, quality: QUALITY },
    );
    const file = name.match(/-\d+x\d+\.svg$/)
      ? name.replace(/-\d+x\d+\.svg$/, `-${width}x${height}.webp`)
      : name.replace(/\.svg$/, ".webp");
    const bytes = Buffer.from(base64, "base64");
    await writeFile(new URL(file, directory), bytes);
    process.stdout.write(
      `${file} ${width}x${height} ${(bytes.length / 1024).toFixed(1)} KB\n`,
    );
  }
} finally {
  await browser.close();
}
