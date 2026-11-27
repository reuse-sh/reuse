---
name: verify-reuse
description: Drives the Reuse documentation site (apps/site) in Chromium the way a reader does, page by page, and audits each page for overflow, contrast, target size, accessible names and keyboard focus. Use to prove a site change on the running app, to capture screens for a UI review, and before reporting visible work finished.
---

# Verify the Reuse site

Run every command from the repository root:

```bash
node .claude/skills/verify-reuse/verify.mjs <command>
```

| Command | Does |
| --- | --- |
| `start` | Starts `pnpm dev` for this checkout on its port and waits for `/sitemap.xml`. A no-op when the site already answers |
| `doctor` | Checks the install, that the site answers, that the listening server runs from this checkout, and that Playwright's Chromium is installed |
| `list [--affected <base>]` | Feature ids. With `--affected`, the features whose code changed since `<base>`, untracked files included. Changed files no feature claims go to stderr as `unmapped <file>` |
| `check <id>... \| --all` | Opens each feature, runs its steps, waits for its proof, saves a full-page screenshot. Prints `ok`, `fail <id> <reason> <screenshot>` or `skip` |
| `map` | Compares `features.json` with the route files and the sitemap |
| `stop` | Stops the server `start` launched |

`check` options: `--out <dir>`, `--width <px>` (default 1280), `--height <px>`, `--block <url glob>` to fail matching requests, `--click <locator>` (repeatable) to click once the page is ready and wait 1.2s before the screenshot, such as a gallery image that opens the lightbox, `--audit` to write `<id>.audit.json` next to each screenshot, `--focus` (with `--audit`) to tab through the page and list focused elements with no outline or shadow, `--viewport` for a viewport-sized screenshot, `--reduced-motion`, `--jobs <n>`.

A page error, a console error, a failed request for the site's own assets or an unexpected status fails the feature.

## Specifics

- The port comes from `REUSE_PORT`, then `.claude/launch.json` (written by `wt.sh adopt`), then 4300. The primary checkout uses 4300; worktrees use 4301 to 4399.
- The site has no sign-in and no data store. Runtime state (pid, log, screenshots without `--out`) lives in a temp directory keyed by the checkout path.
- Playwright and its Chromium come from the repository's own `@playwright/test`.
- Library pages come from `packages/catalog`. `features.json` maps each route pattern to one feature kind with an `expand` regex, and the CLI expands it against `/sitemap.xml`, so a new library or page needs no map change. A new route file does, and `map` reports it.
- `pnpm build` and `next dev` share `apps/site/.next`. When `check` reports a reload loop, stop the server, delete `apps/site/.next/dev`, and start again.
- In `next dev`, Next.js adds its own portal to the tab order. Ignore `nextjs-portal` in focus findings.

## Seed

The site renders catalog data and synthetic demo media. For extreme content, edit the catalog entry or the example under `apps/site/examples/` locally and revert it: a long library name or page title in `packages/catalog/src/index.ts`, a long API row, a long caption or alt text in `apps/site/lib/photos.ts`. Empty and one-item galleries are covered by the package browser tests in `tests/browser`.

## Rules

- A change that adds, moves or removes a page a reader reaches updates `features.json` in the same diff.
- A command the CLI lacks is added to the CLI, not written as a one-off script.
- When `list --affected` prints `unmapped` files, run `check --all`.
