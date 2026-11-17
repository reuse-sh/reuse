import { readdirSync, readFileSync } from "node:fs";

const registry = "https://registry.npmjs.org";

const pending = readdirSync(".changeset").filter(
  (file) => file.endsWith(".md") && file !== "README.md",
);

async function isPublished({ name, version }) {
  const response = await fetch(
    `${registry}/${name.replace("/", "%2f")}/${version}`,
  );
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`${registry} answered ${response.status} for ${name}`);
  }
  return true;
}

async function unpublishedPackages() {
  const manifests = readdirSync("packages")
    .map((dir) =>
      JSON.parse(readFileSync(`packages/${dir}/package.json`, "utf8")),
    )
    .filter((manifest) => !manifest.private);
  const published = await Promise.all(manifests.map(isPublished));
  return manifests
    .filter((_, index) => !published[index])
    .map(({ name, version }) => `${name}@${version}`);
}

let action = "none";
if (pending.length > 0) {
  action = "version";
  console.error(`${pending.length} pending changesets`);
} else {
  const unpublished = await unpublishedPackages();
  if (unpublished.length > 0) action = "publish";
  console.error(`Not on npm: ${unpublished.join(", ") || "none"}`);
}
console.log(`action=${action}`);
