# @reuse-sh/gallery

## 0.0.3

### Patch Changes

- 8ce6da0: Children taken out of the flow, such as an absolutely positioned spinner, no longer take a place in a justified row or a masonry lane. The React components run on React 18 as well as 19.

## 0.0.2

### Patch Changes

- 4203e9f: Add the gallery package: `createJustifiedGallery` lays pictures out in rows that keep their proportions and fill the width, and `createMasonry` stacks items into columns with native `display: grid-lanes` where the browser has it and a matching fallback elsewhere. The React entry adds `JustifiedGallery`, `Masonry`, `useJustifiedGallery` and `useMasonry`.
