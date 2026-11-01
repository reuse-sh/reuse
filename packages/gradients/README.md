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

## Easing gradient

`easingGradient` returns a CSS gradient string. Each stop is a `color-mix()` between the two colors, so any CSS color works, `var()` included, and a transparent end keeps its hue.

```js
import { easingGradient } from "@reuse-sh/gradients";

hero.style.backgroundImage = easingGradient({
  from: "transparent",
  to: "rgb(0 0 0 / 0.8)",
  easing: "ease-in-out-sine",
  direction: "to bottom",
});
```

Easings are `ease-in-out-sine` (the default), `ease-in`, `ease-out`, `linear`, or a cubic bezier tuple such as `[0.23, 1, 0.32, 1]`. Pass `type: "radial"` for a radial gradient. `easingStops` returns the sampled positions and progress for gradients you assemble yourself.

## Fade edge

`createFadeEdge` masks the edges of a horizontal scroller with an eased gradient. In the default `scroll` mode an edge fades in as you scroll away from it.

```js
import { createFadeEdge } from "@reuse-sh/gradients";

const fade = createFadeEdge(strip, { size: 64, curve: "smooth", mode: "scroll" });

// Later
fade.destroy();
```

## Documentation

- Examples and API: https://reuse.sh/easing-gradients

## License

MIT
