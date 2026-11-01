# @reuse-sh/loaders

A canvas loader whose dots move between sixteen geometric figures on one timeline. It stops while hidden and respects reduced motion.

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
