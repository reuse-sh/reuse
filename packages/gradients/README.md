# @reuse-sh/gradients

Eased CSS gradients that sample an easing curve instead of fading in a straight line, so a fade to transparent ends without a visible edge. It also ships a fade edge that masks the sides of a horizontal scroller.

<!-- principles:start -->
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

- Examples and API: https://reuse.sh/gradients

## License

MIT
