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

## Usage

[Documentation](https://reuse.sh/loaders/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/loaders/styles.css" layer(components);
```

#### Usage

Render ThinkingDots at the size of surrounding text. Its fallback is visible before scripts run, and the canvas uses the inherited text color.

```tsx
"use client";

import { ThinkingDots } from "@reuse-sh/loaders/react";

export function ReplyStatus() {
  return <ThinkingDots size={24} label="Preparing reply" />;
}
```

#### Integration

The static dots remain until canvas initialization succeeds. label gives the React loader an accessible status name; omit it for a decorative loader beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure. The React component owns its animation lifecycle.

### HTML + JavaScript

#### Usage

Render the fallback dots and canvas at the size of surrounding text. Its fallback is visible before scripts run, and the canvas uses the inherited text color.

```html
<span id="thinking" class="re-thinking-dots" role="status" aria-label="Preparing reply">
  <span class="re-thinking-dots__fallback" aria-hidden="true" style="width:24px;height:24px"><span></span><span></span><span></span></span>
  <canvas hidden aria-hidden="true"></canvas>
</span>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/loaders/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createThinkingDots } from "@reuse-sh/loaders";

const root = document.querySelector("#thinking");
const canvas = root.querySelector("canvas");
const fallback = root.querySelector(".re-thinking-dots__fallback");
canvas.hidden = false;
let dots;
try {
  dots = createThinkingDots(canvas, { size: 24 });
  fallback.hidden = true;
} catch (error) {
  canvas.hidden = true;
  throw error;
}
```

#### Integration

The static dots remain until canvas initialization succeeds. Use role="status" and aria-label to name a standalone loader; hide a decorative loader from assistive technology beside existing status text. Motion pauses offscreen and in hidden tabs, and reduced motion shows a still figure.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
dots?.destroy();
canvas.hidden = true;
fallback.hidden = false;
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/loaders
- Guide for coding agents: https://reuse.sh/loaders/guide.md

## License

MIT
