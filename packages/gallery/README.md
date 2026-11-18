# @reuse-sh/gallery

Two gallery layouts that CSS does not finish alone. Justified rows keep every picture's proportions and fill each row edge to edge. Masonry stacks items into columns, natively with `display: grid-lanes` where the browser has it and with a fallback that places items the same way elsewhere.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

### Justified gallery

- **Rows fill the width.** Every full row ends at the container's edge at any width, and no item reaches past it.
- **Proportions are kept.** A picture is never cropped or stretched; one row's pictures share one height.
- **The row height is the picture's.** A caption under a picture does not change breaks or picture height.
- **Works before the script.** Server-rendered markup with ratios already lays out in rows.
- **A resize keeps rows while they fit.** Breaks change only when a row leaves the height range, so a scrollbar appearing does not move pictures.
- **A resize paints the new layout.** A window resize lays out in its own frame, before it paints, so the old width's layout never shows. When your script changes the width, call refresh() in the same frame.
- **Hidden keeps its layout.** Width 0 never lays out.
- **Destroy puts back what it wrote.** Destroy disconnects its observers and restores every custom property, attribute and inline style it wrote.

### Masonry

- **The platform lays out first.** Where display: grid-lanes exists, script writes nothing.
- **The fallback places like the platform.** Same CSS, same lanes and offsets as css-grid-3 §4.4, for spans that fit the columns.
- **Columns and gaps are CSS.** One stylesheet drives both paths.
- **DOM order is reading order.** Items are never moved in the document.
- **A resize paints the new layout.** A window resize lays out in its own frame, before it paints, so the old width's layout never shows. When your script changes the width, call refresh() in the same frame.
- **Hidden keeps its layout.** Width 0 never lays out.
- **Destroy puts back what it wrote.** Destroy disconnects its observers and restores every inline style and attribute it wrote.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/gallery
```

<!-- examples:start -->

## Usage

### Justified gallery

[Documentation](https://reuse.sh/justified-gallery/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/gallery/styles.css" layer(components);
```

#### Usage

Every child is an item. Give each image its width and height and the same proportion as --re-ratio, so rows are right before the image loads and before the script runs. Set the target row height in CSS.

```tsx
"use client";

import { JustifiedGallery } from "@reuse-sh/gallery/react";
import type { CSSProperties } from "react";

const prints = [
  { src: "/images/coral-sky.jpg", alt: "Coral sky", width: 1600, height: 900 },
  { src: "/images/blue-hour.jpg", alt: "Blue hour", width: 800, height: 1200 },
  { src: "/images/amber.jpg", alt: "Amber", width: 1200, height: 1200 },
];

export function PrintRows() {
  return <JustifiedGallery className="[--re-justified-row-height:180px] max-sm:[--re-justified-row-height:120px]">
    {prints.map((print) => (
      <img key={print.src} src={print.src} alt={print.alt} width={print.width} height={print.height}
        style={{ "--re-ratio": print.width / print.height } as CSSProperties} />
    ))}
  </JustifiedGallery>;
}
```

#### Integration

Without the script the stylesheet already lays the items out in rows. The controller then chooses the row breaks and sizes every row in percent, so a row scales with its container. The React component owns initialization and teardown.

#### HTML + JavaScript

#### Usage

Every child is an item. Give each image its width and height and the same proportion as --re-ratio, so rows are right before the image loads and before the script runs.

```html
<div id="prints" class="re-justified">
  <img src="/images/coral-sky.jpg" alt="Coral sky" width="1600" height="900" style="--re-ratio: 1.7778" />
  <img src="/images/blue-hour.jpg" alt="Blue hour" width="800" height="1200" style="--re-ratio: 0.6667" />
  <img src="/images/amber.jpg" alt="Amber" width="1200" height="1200" style="--re-ratio: 1" />
</div>
```

#### Styles

Import the package stylesheet once. The target row height is CSS, so a media query can change it.

```css
@import "@reuse-sh/gallery/styles.css";

#prints { --re-justified-row-height: 180px; }
@media (max-width: 640px) { #prints { --re-justified-row-height: 120px; } }
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createJustifiedGallery } from "@reuse-sh/gallery";

const gallery = createJustifiedGallery(document.querySelector("#prints"));
```

#### Integration

Without the script the stylesheet already lays the items out in rows. The controller then chooses the row breaks and sizes every row in percent, so a row scales with its container. Adding, removing or reordering items lays out again.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
gallery.destroy();
```

### Masonry

[Documentation](https://reuse.sh/masonry/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/gallery/styles.css" layer(components);
```

#### Usage

Every child is an item. Set the column count with --re-masonry-columns, here three columns and two on narrow screens. Give images their width and height so a column does not shift when they load.

```tsx
"use client";

import { Masonry } from "@reuse-sh/gallery/react";

const prints = [
  { src: "/images/coral-sky.jpg", title: "Coral sky", text: "Coral, sand and blue.", width: 1600, height: 900 },
  { src: "/images/blue-hour.jpg", title: "Blue hour", text: "Blue, lilac and gold.", width: 800, height: 1200 },
  { src: "/images/amber.jpg", title: "Amber", text: "Orange, yellow and blue.", width: 1200, height: 1200 },
];

export function PrintCards() {
  return <Masonry className="[--re-masonry-columns:3] [--re-masonry-gap:16px] max-md:[--re-masonry-columns:2]">
    {prints.map((print) => (
      <article key={print.src}>
        <img className="block h-auto w-full" src={print.src} alt="" width={print.width} height={print.height} />
        <h3>{print.title}</h3>
        <p>{print.text}</p>
      </article>
    ))}
  </Masonry>;
}
```

#### Integration

Where the browser has display: grid-lanes, it stacks the cards itself and the controller writes nothing. Elsewhere the controller places each card in a column and places them again when a card changes height. The React component owns initialization and teardown.

#### HTML + JavaScript

#### Usage

Every child is an item. Give images their width and height so a column does not shift when they load.

```html
<div id="prints" class="re-masonry">
  <article>
    <img src="/images/coral-sky.jpg" alt="" width="1600" height="900" />
    <h3>Coral sky</h3>
    <p>Coral, sand and blue.</p>
  </article>
  <article>
    <img src="/images/blue-hour.jpg" alt="" width="800" height="1200" />
    <h3>Blue hour</h3>
    <p>Blue, lilac and gold.</p>
  </article>
  <article>
    <img src="/images/amber.jpg" alt="" width="1200" height="1200" />
    <h3>Amber</h3>
    <p>Orange, yellow and blue.</p>
  </article>
</div>
```

#### Styles

Import the package stylesheet once. Columns and gaps are CSS, so a media query can change them.

```css
@import "@reuse-sh/gallery/styles.css";

#prints { --re-masonry-columns: 3; --re-masonry-gap: 16px; }
@media (max-width: 768px) { #prints { --re-masonry-columns: 2; } }
#prints img { display: block; width: 100%; height: auto; }
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createMasonry } from "@reuse-sh/gallery";

const masonry = createMasonry(document.querySelector("#prints"));
```

#### Integration

Where the browser has display: grid-lanes, it stacks the cards itself and masonry.native is true. Elsewhere the controller places each card in a column and places them again when a card changes height. The cards stay in document order either way.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
masonry.destroy();
```

<!-- examples:end -->

## Documentation

- Justified gallery: https://reuse.sh/justified-gallery
- Masonry: https://reuse.sh/masonry
- Guides for coding agents: https://reuse.sh/justified-gallery/guide.md, https://reuse.sh/masonry/guide.md

## License

MIT
