# @reuse-sh/loaders

A canvas loader whose dots move between sixteen geometric figures on one timeline. It stops while hidden and respects reduced motion.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

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

## Browser

```js
import {
  createThinkingDots,
  figureConfig,
} from "@reuse-sh/loaders";

const loader = createThinkingDots(canvas, {
  size: 32,
  config: figureConfig("triangle-turn"),
});
loader.pause();
loader.play();
```

## React

```tsx
import { ThinkingDots } from "@reuse-sh/loaders/react";
import "@reuse-sh/loaders/styles.css";

<ThinkingDots size={24} label="Preparing your answer" />
```

## Documentation

- Examples and API: https://reuse.sh/loaders
- Guide for coding agents: https://reuse.sh/loaders/guide.md

## License

MIT
