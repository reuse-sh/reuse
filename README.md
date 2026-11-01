# Reuse

Project domain: reuse.sh.

Reusable native web libraries with thin React adapters, live examples, and integration guides for coding agents.

The principles are the core of the set. Each library lists a few rules its code keeps: how it scrolls, where focus goes, what it cleans up, how it moves. They carry from one product to the next, and an adaptation on any framework keeps them. They live in packages/catalog and appear on the site, in each package README, and in the agent guides.

## Local development

Use Node.js 22.13 or newer and pnpm 11.15.1.

    pnpm install
    pnpm dev

Open http://127.0.0.1:4300. The site needs no environment variables or external services.

## Libraries

- Lightbox shares native scroll snap and navigation with Carousel. It adds cropped-thumbnail transitions, zoom/pan/pinch, image loading, modal focus, and cleanup.
- Carousel adds mouse dragging, responsive targets, grouping, RTL, controls, synchronization, optional repeat, and an autoplay clock to native scrolling.
- Annotations preserves six kinds, percentage coordinates, a versioned JSON format, HTML transport, validation, rendering, and editing.
- Loaders contains the sixteen ThinkingDots figures, their timeline, native canvas controller, and React integration.
- Shadows provides the six-level CSS scale, ring variants, and code/action card patterns, with no JavaScript.
- Easing gradients builds CSS gradients from an easing curve and fades the edges of horizontal scrollers.
- Interactions contains floating tooltip, moving highlight, hold to confirm, and copy button.
- Avatars provides images/initials, transparent badge cutouts, and overlapping groups.

Each native entry is independent of React. Import the package's /react entry when needed. Original code is MIT.

## Packages and releases

The published packages are @reuse-sh/annotations, avatars, carousel, core, gradients, interactions, lightbox, loaders, and shadows. Each one lives in packages/<name>, with its README.md and, after its first versioned release, its CHANGELOG.md. packages/catalog and apps/site are private and never published.

Every pull request that changes a published package adds a changeset:

    pnpm changeset

Pick the packages, choose patch, minor, or major, and write one line a user of the package would understand. The changeset file is committed with the change.

On every push to main, the release workflow (.github/workflows/release.yml) runs lint, type-check, and tests, then opens or updates a "chore: version packages" pull request with the pending changesets. Merging that pull request bumps the versions, writes the changelogs, and publishes the new versions to npm through npm trusted publishing. No npm token is stored in the repository.

## Workspace

apps/site owns the Next.js marketing site and documentation. packages/catalog is the selected public inventory. Each library has its own package. packages/core contains the small internal clipboard and HTML escaping utilities.

The site includes independent library landing pages, scoped documentation navigation, a library switcher, agent Markdown guides, and a plain HTML example at /examples/native.html.

Turborepo watch rebuilds library dependencies during development. Production builds prepare the standalone ESM examples before building the site. Build outputs are cleaned so deleted source cannot survive in a package distribution.

## Verification

    pnpm lint
    pnpm type-check
    pnpm test
    pnpm build
    node scripts/measure-native.mjs

The measurement follows native ESM imports, rejects external runtime imports, and records unminified/gzipped module totals in docs/native-sizes.json. It excludes React adapters and CSS. Browser checks remain necessary for scroll snap, gestures, focus, canvas animation, and responsive layout.

## Scope

The carousel is the foundational set. Paid Visual Portfolio effects and marquee are not included. Repeat retains original DOM and requires cycleWidth >= viewportWidth + largestSlideWidth; isLooping reports availability. There are no duplicate slide clones.

The lightbox baseline is images. Captions and optional thumbnails are supported. Custom content can use renderContent, but video/iframe renderers, Poise widget coordination, and product-specific annotation cloning are not included.

No existing product has been migrated by this change. Poise, Visual Portfolio, Pro, and Fantasma remain separate consumers. Publication and product migrations require their own release verification.

## Agent guides

Read /llms.txt, then /{library}/guide.md. Guides describe the real API, current boundaries, and checks. Reuse the implementation, adapt the integration, and report evidence. Do not generate a replacement engine.

## Licensing

Original code is MIT. See LICENSE and THIRD_PARTY_NOTICES.md. Demo photos and the site font keep their own asset licenses.
