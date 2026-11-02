# @reuse-sh/annotations

Areas, spotlights, arrows, lines, pointers, and markers drawn over an image in percentage coordinates. One validated JSON format is used for storage, rendering, and the editor.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Store one versioned format.** Annotations live in one version 1 JSON document, and an unknown version throws instead of being guessed.
- **Place marks in percent.** Coordinates are percentages of the image, so every mark keeps its place at any size.
- **Check input at the edge.** Parsing clamps coordinates, drops invalid marks, and escapes marker text except strong, em and code.
- **Render without a browser.** The same document renders to HTML on the server, with no DOM needed.
- **Leave storage to the host.** The editor reports every change through onChange, and your code decides where the document goes.
- **Edit from the keyboard.** Marks can be created, selected, moved and deleted with keys, and one drag is one undo step.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/annotations
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/annotations/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy `example.tsx` into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/annotations/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [annotations-start](https://reuse.sh/examples/annotations-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/annotations
- Guide for coding agents: https://reuse.sh/annotations/guide.md

## License

MIT
