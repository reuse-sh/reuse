# @reuse-sh/shadows

A CSS shadow scale with six levels, from a small control to a floating surface. Each level has two soft layers and an optional hairline ring. It also ships a fade edge for horizontal scrollers.

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
<div class="reuse-card reuse-shadow-ring-md">
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
