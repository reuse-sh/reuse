# @reuse-sh/avatars

Avatars with images, Unicode-aware initials, and badges cut out of the image instead of painted rings. Groups keep that shape where avatars overlap.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Show content before enhancement.** Photos and initials are available before scripts run, and initials remain when an image fails.
- **Cut, never paint.** Badges and overlaps are vector clips through the avatar, so no painted ring fights the background and the edge stays sharp at any zoom.
- **Keep initials underneath.** Initials show until the image loads and stay if it fails.
- **Name badges in words.** The badge label joins the accessible name, and the drawing stays decorative.
- **Treat text as text.** Names, labels and icons go in as text or nodes and are never parsed as HTML.
- **Size cutouts from the badge.** Counts of two digits or more get a capsule cutout measured from the badge itself.
- **Restore the host.** Destroy puts back the original content, styles and listeners.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/avatars
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/avatars/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy `example.tsx` into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/avatars/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [avatars-start](https://reuse.sh/examples/avatars-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/avatars
- Guide for coding agents: https://reuse.sh/avatars/guide.md

## License

MIT
