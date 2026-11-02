# @reuse-sh/carousel

A carousel that keeps native touch and trackpad scrolling with CSS snap. It adds mouse dragging, grouping, RTL, synchronized carousels, optional repeat, and autoplay.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Let the browser scroll.** Touch and trackpads scroll natively with CSS scroll snap, and every move from code is a scroll too.
- **Never let a drag click.** A mouse drag, or the mouse press that stops a moving strip, never opens the link under it. An ordinary click still works, and touch stays native.
- **Drag like a trackpad.** A released mouse drag keeps its speed and glides to the slide nearest where it would stop, never past a slide that asks to stop. Past either end it stretches and springs back.
- **Keep the slide it was sent to.** When the last slides share one scroll position, the active index stays the slide that goTo, a dot or a lightbox chose.
- **Repeat without clones.** The loop moves the original slides, so ids, links and buttons stay unique, and it turns on only when the slides can cover the viewport.
- **Let autoplay wait for people.** Autoplay pauses for hover, focus, dragging, hidden pages, offscreen strips and reduced motion.
- **Keep keys local.** Arrow keys act only inside the focused strip and swap sides in right-to-left layouts.
- **Put back what it moved.** Destroy cancels timers and restores the styles, transforms and listeners it added.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/carousel
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/carousel/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy every file from the Code tab into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/carousel/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [carousel-start](https://reuse.sh/examples/carousel-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/carousel
- Guide for coding agents: https://reuse.sh/carousel/guide.md

## License

MIT
