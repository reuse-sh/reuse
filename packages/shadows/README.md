# @reuse-sh/shadows

A CSS shadow scale with six levels, from a small control to a floating surface. Each level has two soft layers and an optional hairline ring.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Build each level from two layers.** Every level is a close shadow and a wide one, drawn from one color and one strength.
- **Set color and strength once.** --re-shadow-color and --re-shadow-strength drive all six levels, and a dark ancestor raises the strength and lightens the ring.
- **Use a ring, not a border.** The ring variants add a hairline in the shadow itself, so the element's size never changes.
- **Work without JavaScript.** The levels and cards are plain classes in one stylesheet.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/shadows
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/shadows/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy `example.tsx` into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/shadows/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [shadows-start](https://reuse.sh/examples/shadows-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/shadows
- Guide for coding agents: https://reuse.sh/shadows/guide.md

## License

MIT
