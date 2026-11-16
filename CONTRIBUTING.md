# Working on Reuse

Start with a concrete use case and read docs/catalogue.md. Implement one component at a time.

Put reusable browser behavior in packages/core. Put React integration in packages/react. Build the live example in apps/site, then update the shared catalogue and agent usage. Keep the implementation independent of the site.

Run pnpm lint, pnpm type-check, pnpm test, and pnpm build. Check the actual interaction at desktop and narrow widths, with keyboard input and reduced motion where relevant. Report browser or device behavior that has not been tested.

Every library lists its principles in packages/catalog. They are the rules the code keeps, and they matter more than the code itself, because an adaptation on another framework keeps them too. When you change how a component behaves, update its principles in the same pull request, then run `pnpm principles` to rewrite the package READMEs. `pnpm lint` fails while a README is out of date.

Do not change an entry to available until it has working code, a demo, usage, an agent guide, and verification. Do not publish packages or create a deployment as part of a local component change.

## Browser tests

`pnpm test:browser` runs Playwright. Untagged tests in tests/browser run in the `packages` project, desktop Chromium at 1000×700. Tag a test `@touch` to run it in `chromium-touch` and `webkit-touch`, phones at 390×844 with touch, and `@desktop` to run it in `chromium-desktop` and `firefox-desktop`, laptops at 1440×900 with a mouse. Run `pnpm exec playwright install chromium firefox webkit` once.

tests/browser/harness.ts holds the shared helpers: `mount` serves the built packages to a test page, `swipe` drags a finger or the mouse at a given speed with a pause before release, `pinch` moves two fingers, `ctrlWheel` sends a wheel with ctrlKey, `safariPinch` sends Safari's gesture events, `countLayoutReads` counts getBoundingClientRect and getComputedStyle calls inside pointer move, wheel and scroll listeners, `recordFrames` records frame durations and long tasks, and `frameInterval` replaces requestAnimationFrame with a fixed frame rate. Chromium gets trusted touches; WebKit gets synthesized pointer events, which run handlers but cannot scroll natively.

tests/model holds the worlds that the package tests explore under every order of steps.

## Browser builds

Carousel and Lightbox build `dist/browser/`, one minified ES module per entry with no imports by name. scripts/browser-builds.json lists each package's entries and the gzip budget of every file in KB. The package build fails when a file passes its budget or has none. A change that adds behavior raises the budget to its new size plus 10% and gives the size before and after in its pull request. A stylesheet named base.css goes in `@layer re.base`, theme.css and themes/ in `@layer re.theme`, each with a copy without the layer in `dist/unlayered/`.

## Releasing

Packages publish through Changesets. Add a changeset with `pnpm changeset` in every pull request that changes a published package. The release workflow keeps a "chore: version packages" pull request open. Merging it bumps versions, writes each package's CHANGELOG.md, and publishes to npm with trusted publishing from GitHub Actions.

The first publish of 0.0.1 is done once by hand, because npm only accepts a trusted publisher for a package that already exists:

1. Check out a clean, up-to-date main.
2. Run `npm login` with an account that can publish to the @reuse-sh scope.
3. Run `pnpm install`, then `pnpm build`.
4. Run `pnpm changeset publish`. It publishes every package version that is missing from npm.
5. On npmjs.com, open each published package, go to Settings, and add a trusted publisher: GitHub Actions, repository reuse-sh/reuse, workflow release.yml.

After that, releases only happen through the workflow.
