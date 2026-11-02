# @reuse-sh/gradients

Eased CSS gradients that sample an easing curve instead of fading in a straight line, so a fade to transparent ends without a visible edge. It also ships a fade edge that masks the sides of a horizontal scroller.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Ease the stops.** The gradient samples an easing curve into a dozen stops instead of one straight ramp, so a fade has no hard edge where it starts or ends.
- **Mix in oklab.** Each stop is a color-mix() in oklab, so a fade to transparent keeps its hue instead of passing through gray.
- **Take any CSS color.** The colors are written into the gradient as CSS, so names, oklch() and var() values all work and the browser resolves them.
- **Grow the fade with the scroll.** In scroll mode each edge of a scroller fades in by the distance left to scroll, so the start stays sharp until you move, and the mask follows right-to-left layouts.
- **Refuse broken input.** An unknown easing, a bezier outside 0 to 1 or fewer than two stops throws a RangeError instead of writing a gradient the browser drops.
- **Restore what it touched.** The fade edge's destroy disconnects its observers and puts the scroller's original style attribute back exactly.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/gradients
```

<!-- examples:start -->

## Complete examples

The [React example](https://reuse.sh/easing-gradients/getting-started?view=code) includes its data, Tailwind styling and package CSS imports. Copy every file from the Code tab into a React 19 project with Tailwind CSS 4, then render `<Example />`.

The [HTML + JavaScript example](https://reuse.sh/easing-gradients/getting-started?framework=html&view=code) contains its HTML, stylesheet and any required browser module. Copy every file into an ES module project such as Vite. Its initial markup stays useful before JavaScript.

Runnable browser example: [gradients-start](https://reuse.sh/examples/gradients-start/index.html).

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/easing-gradients

## License

MIT
