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

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/annotations/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/annotations/styles.css" layer(components);
```

#### Usage

Pass image dimensions and a typed annotation list to AnnotatedImage. Coordinates are percentages of the image, so a mark keeps its position when the image becomes narrower.

```tsx
import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";

export function ReviewImage() {
  const annotations: Annotation[] = [
    { kind: "marker", point: [38, 46], text: "Check the paper texture." },
  ];
  return <AnnotatedImage src="/images/proof.jpg" alt="Print proof" width={1200} height={900} annotations={annotations} />;
}
```

#### Integration

The HTML list preserves the note before enhancement and the controller restores it on destroy. React renders the image and notes on the server. Give every image useful alt text; annotation labels add detail rather than replacing it.

### HTML + JavaScript

#### Usage

Pass image dimensions and a typed annotation list to AnnotatedImage. Coordinates are percentages of the image, so a mark keeps its position when the image becomes narrower.

```html
<div id="review-image">
  <img src="/images/proof.jpg" alt="Print proof" width="1200" height="900" />
  <ol data-annotations>
    <li data-kind="marker" data-point="38 46">Check the paper texture.</li>
  </ol>
</div>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/annotations/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { annotationsFromHtml, createAnnotatedImage } from "@reuse-sh/annotations";

const root = document.querySelector("#review-image");
const annotations = annotationsFromHtml(root);
const image = createAnnotatedImage(root, {
  src: "/images/proof.jpg", alt: "Print proof", width: 1200, height: 900, annotations,
});
```

#### Integration

The HTML list preserves the note before enhancement and the controller restores it on destroy. React renders the image and notes on the server. Give every image useful alt text; annotation labels add detail rather than replacing it.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
image.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/annotations
- Guide for coding agents: https://reuse.sh/annotations/guide.md

## License

MIT
