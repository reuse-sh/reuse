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

## Usage

[Documentation](https://reuse.sh/easing-gradients/getting-started)

### React

#### Tailwind 4

If your app uses Tailwind 4, import the adapter in the stylesheet processed by Tailwind. Use this import instead of @reuse-sh/gradients/styles.css. The utilities read your theme colors and accept opacity modifiers.

```css
@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";
```

#### Usage

Use re-gradient for the default sine fade and supply the required end color with re-gradient-to-*. This example uses the background color from your theme at 85% opacity. Replace background with any color token from your theme. A direction modifier chooses the fade direction.

```tsx
import "./app.css";

<div className="re-gradient re-gradient-dir-b re-gradient-from-transparent re-gradient-to-background/85 rounded-xl p-6">
  Print collection
</div>
```

#### Integration

The default curve is ease-in-out-sine with twelve stops. re-gradient-ease-in, re-gradient-ease-out and re-gradient-linear choose the other built-in curves; re-gradient-ease-in-out-sine states the default explicitly. CSS presets are linear gradients and need no JavaScript. Use easingGradient from @reuse-sh/gradients for custom bezier curves, radial gradients or a custom stop count.

### HTML + JavaScript

#### Usage

Import the stylesheet, add re-gradient and set --re-gradient-to to the required end color. The start defaults to transparent. A re-gradient-dir-* class chooses the direction; --re-gradient-direction accepts a custom CSS direction.

```html
<div class="re-gradient re-gradient-dir-b re-caption-fade">Print collection</div>
```

#### Styles

Import the package stylesheet once and set the colors on your element or an ancestor. Without an end color, the gradient cannot render.

```css
@import "@reuse-sh/gradients/styles.css";

.re-caption-fade {
  --re-gradient-from: transparent;
  --re-gradient-to: rgb(0 0 0 / 85%);
}
```

#### Integration

The default curve is ease-in-out-sine with twelve stops. re-gradient-ease-in, re-gradient-ease-out and re-gradient-linear choose the other built-in curves; re-gradient-ease-in-out-sine states the default explicitly. CSS presets are linear gradients and need no JavaScript. Use easingGradient from @reuse-sh/gradients for custom bezier curves, radial gradients or a custom stop count.

#### Tailwind 4

For Tailwind 4, replace the plain styles.css import with the adapter in your Tailwind stylesheet. Replace re-caption-fade with color utilities such as re-gradient-from-transparent re-gradient-to-black/85. These utilities read your theme colors and accept opacity modifiers. The destination color is still required.

```css
@import "tailwindcss";
@import "@reuse-sh/gradients/tailwind.css";
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/easing-gradients

## License

MIT
