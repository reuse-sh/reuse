# Working on Reuse

Start with a concrete use case and read docs/catalogue.md. Implement one component at a time.

Put reusable browser behavior in packages/core. Put React integration in packages/react. Build the live example in apps/site, then update the shared catalogue and agent usage. Keep the implementation independent of the site.

Run pnpm lint, pnpm type-check, pnpm test, and pnpm build. Check the actual interaction at desktop and narrow widths, with keyboard input and reduced motion where relevant. Report browser or device behavior that has not been tested.

Every library lists its principles in packages/catalog. They are the rules the code keeps, and they matter more than the code itself, because an adaptation on another framework keeps them too. When you change how a component behaves, update its principles in the same pull request, then run `pnpm principles` to rewrite the package READMEs. `pnpm lint` fails while a README is out of date.

Do not change an entry to available until it has working code, a demo, usage, an agent guide, and verification. Do not publish packages or create a deployment as part of a local component change.

## Releasing

Packages publish through Changesets. Add a changeset with `pnpm changeset` in every pull request that changes a published package. The release workflow keeps a "chore: version packages" pull request open. Merging it bumps versions, writes each package's CHANGELOG.md, and publishes to npm with trusted publishing from GitHub Actions.

The first publish of 0.0.1 is done once by hand, because npm only accepts a trusted publisher for a package that already exists:

1. Check out a clean, up-to-date main.
2. Run `npm login` with an account that can publish to the @reuse-sh scope.
3. Run `pnpm install`, then `pnpm build`.
4. Run `pnpm changeset publish`. It publishes every package version that is missing from npm.
5. On npmjs.com, open each published package, go to Settings, and add a trusted publisher: GitHub Actions, repository reuse-sh/reuse, workflow release.yml.

After that, releases only happen through the workflow.
