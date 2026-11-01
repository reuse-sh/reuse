# @reuse-sh/shadows

A CSS shadow scale with six levels, from a small control to a floating surface. Each level has two soft layers and an optional hairline ring. It also ships a fade edge for horizontal scrollers.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Build each level from two layers.** Every level is a close shadow and a wide one, drawn from one color and one strength.
- **Set color and strength once.** --re-shadow-color and --re-shadow-strength drive all six levels, and a dark ancestor raises the strength and lightens the ring.
- **Use a ring, not a border.** The ring variants add a hairline in the shadow itself, so the element's size never changes.
- **Work without JavaScript.** The levels and cards are plain classes in one stylesheet.
- **Fade only where there is more.** The fade edge masks a side only while there is content left to scroll toward it, and it follows right-to-left layouts.
- **Put the inline style back.** Destroy restores the scroller's original inline style exactly.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/shadows
```

## Usage

Import the stylesheet once, then add the classes to any element.

```js
import "@reuse-sh/shadows/styles.css";
```

```html
<div class="re-card re-shadow-ring-md">
  Your content
</div>
```

## Fade edge

`createFadeEdge` masks the edges of a horizontal scroller with an eased gradient. In the default `scroll` mode an edge fades in as you scroll away from it.

```js
import { createFadeEdge } from "@reuse-sh/shadows";

const fade = createFadeEdge(strip, { size: 64, curve: "smooth", mode: "scroll" });

// Later
fade.destroy();
```

## Documentation

- Examples and API: https://reuse.sh/shadows
- Guide for coding agents: https://reuse.sh/shadows/guide.md

## License

MIT
