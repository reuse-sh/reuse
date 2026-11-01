# Working on Reuse

Start with a concrete use case and read docs/catalogue.md. Implement one component at a time.

Put reusable browser behavior in packages/core. Put React integration in packages/react. Build the live example in apps/site, then update the shared catalogue and agent usage. Keep the implementation independent of the site.

Run pnpm lint, pnpm type-check, pnpm test, and pnpm build. Check the actual interaction at desktop and narrow widths, with keyboard input and reduced motion where relevant. Report browser or device behavior that has not been tested.

Do not change an entry to available until it has working code, a demo, usage, an agent guide, and verification. Do not publish packages or create a deployment as part of a local component change.
