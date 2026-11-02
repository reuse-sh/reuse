import { createRequire } from "node:module";
import { expect, test } from "@playwright/test";
import {
  inspectSource,
  validateClasses,
} from "../../scripts/check-design-system.mjs";

const requireSite = createRequire(
  new URL("../../apps/site/package.json", import.meta.url),
);
const { createCn: siteCreateCn } = requireSite("cn/engine") as {
  createCn: (tables: unknown) => (...classes: string[]) => string;
};

test("compiled cn tables keep semantic typography and color while merging layout and surface roles", async () => {
  const { default: tables } = await import("../../apps/site/.cn/tables.mjs");
  const cn = siteCreateCn(tables);
  expect(cn("text-body text-foreground")).toBe("text-body text-foreground");
  expect(cn("rounded-control rounded-panel")).toBe("rounded-panel");
  expect(cn("p-4 p-8")).toBe("p-8");
  expect(cn("shadow-control shadow-raised")).toBe("shadow-raised");
});

test("source guard rejects arbitrary design values and legacy aliases in actual TSX", async () => {
  const errors = await inspectSource(
    'export function Bad() { return <p className="text-[13px] text-[color:var(--ink)] c-text">Text</p> }',
    "fixture.tsx",
  );
  expect(errors).toHaveLength(3);
  expect(
    validateClasses(
      "text-body text-foreground aria-[current=true]:text-foreground [&_svg]:size-4",
    ),
  ).toEqual([]);
});
