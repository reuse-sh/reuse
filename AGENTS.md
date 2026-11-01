# Reuse repository instructions

Read DESIGN.md before visible UI work and docs/catalogue.md before expanding the collection.

- Keep code, documentation, and product copy in English.
- Use pnpm. The site uses Next.js App Router. Read the relevant guide in apps/site/node_modules/next/dist/docs before changing Next.js code.
- Keep browser logic independent of React. React wrappers own React lifecycle and composition.
- Import individual package entry points. Add a runtime dependency only for a concrete capability the browser and current packages cannot provide.
- Scope styles with reuse- classes and --reuse- custom properties. Never reset a host page from a library stylesheet.
- Reuse native browser interactions when they meet the documented scope. Do not recreate accessible state handling without a reason.
- Every selected library needs an implementation, a live example, a usage snippet, an agent guide, and meaningful verification. Do not add a broad planned component catalogue. Keep the selected scope in docs/catalogue.md.
- The catalogue is the shared inventory. Keep generated human and agent documentation consistent by reading it from packages/catalog.
- Test behavior and observable output. Cover failure, teardown, repeated input, reduced motion, keyboard access, and narrow layouts where relevant.
- Use synthetic examples. Do not copy customer data, credentials, environment files, or product-specific services into this repository.
- Original code is MIT. Keep packages private until npm publication is explicitly authorized.
- Run pnpm lint, pnpm type-check, pnpm test, and pnpm build after relevant changes. Verify visible changes in a running browser.
- The local site uses port 4300. Reuse its server when it already belongs to this checkout.
