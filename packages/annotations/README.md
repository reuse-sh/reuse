# @reuse-sh/annotations

Areas, spotlights, arrows, lines, pointers, and markers drawn over an image in percentage coordinates. One validated JSON format is used for storage, rendering, and the editor.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Store one versioned format.** Annotations live in one version 1 JSON document, and an unknown version throws instead of being guessed.
- **Place marks in percent.** Coordinates are percentages of the image, so every mark keeps its place at any size.
- **Check input at the edge.** Parsing clamps coordinates, drops invalid marks, and escapes marker text except strong, em and code.
- **Render without a browser.** The same document renders to HTML on the server, with no DOM needed.
- **Leave storage to the host.** The editor reports every change through onChange, and your code decides where the document goes.
- **Edit from the keyboard.** Marks can be created, selected, moved and deleted with keys, and one drag is one undo step.

<!-- principles:end -->

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
