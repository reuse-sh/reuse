import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const registry = "https://registry.npmjs.org";

async function isPublished({ name, version }, lookup) {
  const response = await lookup(
    `${registry}/${name.replace("/", "%2f")}/${version}`,
  );
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`${registry} answered ${response.status} for ${name}`);
  }
  return true;
}

export async function planRelease(root = ".", lookup = fetch) {
  const prePath = join(root, ".changeset", "pre.json");
  const pre = existsSync(prePath) ? JSON.parse(readFileSync(prePath)) : null;
  const consumed = new Set(pre?.mode === "pre" ? pre.changesets : []);
  const pending = readdirSync(join(root, ".changeset")).filter(
    (file) =>
      file.endsWith(".md") &&
      file !== "README.md" &&
      !consumed.has(file.slice(0, -3)),
  );
  if (pending.length > 0)
    return { action: "version", pending, unpublished: [] };

  const manifests = readdirSync(join(root, "packages"))
    .map((dir) =>
      JSON.parse(readFileSync(join(root, "packages", dir, "package.json"))),
    )
    .filter((manifest) => !manifest.private);
  const published = await Promise.all(
    manifests.map((manifest) => isPublished(manifest, lookup)),
  );
  const unpublished = manifests
    .filter((_, index) => !published[index])
    .map(({ name, version }) => `${name}@${version}`);
  return {
    action: unpublished.length > 0 ? "publish" : "none",
    pending,
    unpublished,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { action, pending, unpublished } = await planRelease();
  console.error(
    pending.length > 0
      ? `Pending changesets: ${pending.length}`
      : `Not on npm: ${unpublished.join(", ") || "none"}`,
  );
  console.log(`action=${action}`);
}
