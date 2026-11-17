import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { planRelease } from "../../scripts/release-plan.mjs";

function workspace(changesets: string[], packages: Record<string, unknown>[]) {
  const root = mkdtempSync(join(tmpdir(), "release-plan-"));
  mkdirSync(join(root, ".changeset"));
  for (const file of ["README.md", "config.json", ...changesets]) {
    writeFileSync(join(root, ".changeset", file), "");
  }
  packages.forEach((manifest, index) => {
    mkdirSync(join(root, "packages", String(index)), { recursive: true });
    writeFileSync(
      join(root, "packages", String(index), "package.json"),
      JSON.stringify(manifest),
    );
  });
  return root;
}

const carousel = { name: "@reuse-sh/carousel", version: "0.1.1" };
const lightbox = { name: "@reuse-sh/lightbox", version: "0.0.7" };
const site = { name: "@reuse-sh/site", version: "0.0.0", private: true };

function registry(missing: string[], status = 404) {
  const requested: string[] = [];
  const lookup = async (url: string) => {
    requested.push(url);
    const hit = missing.some((path) => url.endsWith(path));
    return new Response("", { status: hit ? status : 200 });
  };
  return { lookup, requested };
}

test("pending changesets refresh the version pull request without asking npm", async () => {
  const { lookup, requested } = registry([]);
  const plan = await planRelease(
    workspace(["brave-lions.md"], [carousel]),
    lookup,
  );
  expect(plan.action).toBe("version");
  expect(requested).toEqual([]);
});

test("a version missing from npm publishes, and private packages are never looked up", async () => {
  const { lookup, requested } = registry(["%2flightbox/0.0.7"]);
  const plan = await planRelease(
    workspace([], [carousel, lightbox, site]),
    lookup,
  );
  expect(plan).toEqual({
    action: "publish",
    pending: [],
    unpublished: ["@reuse-sh/lightbox@0.0.7"],
  });
  expect(requested).toEqual([
    "https://registry.npmjs.org/@reuse-sh%2fcarousel/0.1.1",
    "https://registry.npmjs.org/@reuse-sh%2flightbox/0.0.7",
  ]);
});

test("nothing pending and everything on npm skips the release", async () => {
  const { lookup } = registry([]);
  const plan = await planRelease(workspace([], [carousel, lightbox]), lookup);
  expect(plan.action).toBe("none");
});

test("a registry error fails the plan instead of skipping or publishing", async () => {
  const { lookup } = registry(["%2flightbox/0.0.7"], 503);
  await expect(
    planRelease(workspace([], [carousel, lightbox]), lookup),
  ).rejects.toThrow("answered 503 for @reuse-sh/lightbox");
});
