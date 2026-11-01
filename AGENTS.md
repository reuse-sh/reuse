# Reuse repository instructions

Read DESIGN.md before visible UI work and docs/catalogue.md before expanding the collection.

- Keep code, documentation, and product copy in English.
- Use pnpm. The site uses Next.js App Router. Read the relevant guide in apps/site/node_modules/next/dist/docs before changing Next.js code.
- Keep browser logic independent of React. React wrappers own React lifecycle and composition.
- Import individual package entry points. Add a runtime dependency only for a concrete capability the browser and current packages cannot provide.
- Scope styles with re- classes and --re- custom properties. Never reset a host page from a library stylesheet.
- Reuse native browser interactions when they meet the documented scope. Do not recreate accessible state handling without a reason.
- Every selected library needs an implementation, a live example, a usage snippet, an agent guide, and meaningful verification. Do not add a broad planned component catalogue. Keep the selected scope in docs/catalogue.md.
- The catalogue is the shared inventory. Keep generated human and agent documentation consistent by reading it from packages/catalog.
- Principles are the core of the set. Every library lists its principles in packages/catalog. They are short rules its code keeps, and any adaptation must keep them too.
- A change that alters a component's behavior updates its principles in the same pull request.
- pnpm principles rewrites the Principles section of each package README from the catalog. pnpm lint fails when a README drifts from it.
- Test behavior and observable output. Cover failure, teardown, repeated input, reduced motion, keyboard access, and narrow layouts where relevant.
- Use synthetic examples. Do not copy customer data, credentials, environment files, or product-specific services into this repository.
- Original code is MIT. Packages publish to npm through Changesets. Every user-visible package change adds a changeset with pnpm changeset.
- Run pnpm lint, pnpm type-check, pnpm test, and pnpm build after relevant changes. Verify visible changes in a running browser.
- The local site uses port 4300. Reuse its server when it already belongs to this checkout.
