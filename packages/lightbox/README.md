# @reuse-sh/lightbox

An image viewer that opens from a thumbnail, including a cropped one, and returns to it on close. Pages scroll and swipe with the browser, and images zoom with pinch, pan, double-tap, and the pointer.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Page with native scroll snap.** Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum.
- **Open from the thumbnail and return to it.** The image grows out of its cropped preview and goes back to the same place on close.
- **Load only what is near.** Only the current and neighboring images load, and a long jump skips the pages in between.
- **Zoom around the point you touch.** Pinch, wheel and double-tap zoom around the pointer or fingers, and panning stops at the image's edges.
- **Keep focus inside and give it back.** The viewer is a native modal dialog, and closing it returns focus to the element that opened it.
- **Leave the page as it was.** Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/lightbox
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/lightbox/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy every file from the Code tab into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/lightbox/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [lightbox-start](https://reuse.sh/examples/lightbox-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/lightbox
- Guide for coding agents: https://reuse.sh/lightbox/guide.md

## License

MIT
