import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const root = join(import.meta.dirname, "..");
const name = process.argv[2];
const directory = join(root, "packages", name ?? "", "dist");

async function write(name, content) {
  const file = join(directory, name);
  const previous = await readFile(file, "utf8").catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return undefined;
  });
  if (previous !== content) await writeFile(file, content);
}

function rule(selector, body) {
  return `${selector} {\n${body.trim()}\n}\n`;
}

if (name === "shadows") {
  const source = await readFile(
    join(root, "packages/shadows/src/styles.css"),
    "utf8",
  );
  const rules = Array.from(source.matchAll(/([^{}]+)\{([^{}]*)\}/g));
  const defaults = rules
    .filter(([_, selectors]) =>
      [":root", '[data-re-theme="dark"]'].includes(selectors.trim()),
    )
    .map(([_, selectors, body]) => rule(selectors.trim(), body))
    .join("\n");
  const utilities = new Map();
  for (const [_, selectors, body] of rules) {
    for (const selector of selectors.split(",")) {
      const match = /^\.re-shadow-(?:ring-)?(?:xs|sm|md|lg|xl|2xl)$/.exec(
        selector.trim(),
      );
      if (!match) continue;
      const utility = match[0].slice(1);
      utilities.set(utility, (utilities.get(utility) ?? "") + body.trim());
    }
  }
  if (utilities.size !== 12 || !defaults)
    throw new Error("The shadow stylesheet no longer has the expected rules.");
  const cardStart = source.search(/^\.re-card\s*\{/m);
  const frame = rules.find(
    ([_, selectors]) =>
      selectors.includes(".re-shadow-sm") &&
      selectors.includes(".re-card-frame"),
  );
  if (cardStart < 0 || !frame)
    throw new Error("The shadow card rules are missing.");
  const cards = rule(".re-card-frame", frame[2]) + source.slice(cardStart);
  await write(
    "tailwind.css",
    `@layer base {\n${defaults}}\n\n@layer components {\n${cards}}\n\n${Array.from(utilities, ([name, body]) => rule(`@utility ${name}`, body)).join("\n")}`,
  );
} else if (name === "gradients") {
  const { EASINGS, easingGradient } = await import(
    pathToFileURL(join(directory, "easing.js")).href
  );
  const gradient = (easing) =>
    easingGradient({
      from: "var(--re-gradient-from, transparent)",
      to: "var(--re-gradient-to)",
      direction: "var(--re-gradient-direction, to bottom)",
      easing,
    });
  const utilities = new Map([
    [
      "re-gradient",
      `--re-gradient-image: ${gradient(EASINGS[0])};\nbackground-image: var(--re-gradient-image);`,
    ],
    ["re-gradient-from-transparent", "--re-gradient-from: transparent;"],
    ["re-gradient-to-transparent", "--re-gradient-to: transparent;"],
    ...EASINGS.map((easing) => [
      `re-gradient-${easing}`,
      `--re-gradient-image: ${gradient(easing)};`,
    ]),
    ...Object.entries({
      t: "top",
      tr: "top right",
      r: "right",
      br: "bottom right",
      b: "bottom",
      bl: "bottom left",
      l: "left",
      tl: "top left",
    }).map(([name, direction]) => [
      `re-gradient-dir-${name}`,
      `--re-gradient-direction: to ${direction};`,
    ]),
  ]);
  await write(
    "styles.css",
    Array.from(utilities, ([name, body]) => rule(`.${name}`, body)).join("\n"),
  );
  await write(
    "tailwind.css",
    Array.from(utilities, ([name, body]) =>
      rule(`@utility ${name}`, body),
    ).join("\n") +
      ["from", "to"]
        .map((side) =>
          rule(
            `@utility re-gradient-${side}-*`,
            `--re-gradient-${side}: --value(--color-*);\n--re-gradient-${side}: --alpha(--value(--color-*) / calc(--modifier(number) * 1%));`,
          ),
        )
        .join("\n"),
  );
} else {
  throw new Error("Expected shadows or gradients.");
}
