# @reuse-sh/annotations

Areas, spotlights, arrows, lines, pointers, and markers drawn over an image in percentage coordinates. One validated JSON format is used for storage, rendering, and the editor.

## Install

```sh
npm install @reuse-sh/annotations
```

## Browser

```js
import {
  parseAnnotations,
  createAnnotatedImage,
} from "@reuse-sh/annotations";
import "@reuse-sh/annotations/styles.css";

const annotations = parseAnnotations([{
  kind: "area",
  box: [10, 20, 35, 25],
  label: "The part to notice",
}]);
const image = createAnnotatedImage(root, {
  src: "/photo.jpg", alt: "A mountain lake",
  width: 1600, height: 1200, annotations,
});
```

## React

```tsx
import { AnnotationEditor } from "@reuse-sh/annotations/react";
import "@reuse-sh/annotations/styles.css";

<AnnotationEditor
  src="/photo.jpg"
  alt="A mountain lake"
  annotations={annotations}
  onChange={setAnnotations}
  width={1600}
  height={1200}
/>
```

## Documentation

- Examples and API: https://reuse.sh/annotations
- Guide for coding agents: https://reuse.sh/annotations/guide.md

## License

MIT
