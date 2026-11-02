# @reuse-sh/loaders

A canvas loader whose dots move between sixteen geometric figures on one timeline. It stops while hidden and respects reduced motion.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Show a static figure first.** Server-rendered markup keeps visible dots until the canvas has painted successfully.
- **Move dots, not frames.** Between figures each dot travels to its new place instead of popping.
- **Show every figure in turn.** The default sequence shows each figure once per round and never the same one twice running.
- **Draw in the text color.** The canvas takes its color from the surrounding text, so it fits any theme.
- **Stop when unseen.** The clock pauses offscreen and in hidden tabs, and reduced motion shows a still figure.
- **Stay silent unless labeled.** The dots are decorative, and a label turns them into a status for screen readers.
- **Give the canvas back.** Destroy stops the clock and restores the canvas.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/loaders
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/loaders/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy every file from the Code tab into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/loaders/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [loaders-start](https://reuse.sh/examples/loaders-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/loaders
- Guide for coding agents: https://reuse.sh/loaders/guide.md

## License

MIT
