# @reuse-sh/gallery

## 0.0.7

### Patch Changes

- f63bcde: A window resize lays out the justified gallery and masonry in the same frame, before it paints. Both laid out on the next frame, so every resize showed one frame of the previous width's layout: masonry items off by a few pixels, and at a column or row break items in the wrong place.

## 0.0.6

### Patch Changes

- f0db196: The masonry fallback keeps the empty lanes of `repeat(auto-fit, ...)` when there are fewer items than lanes, as native grid lanes do, and measures lanes that differ only by layout rounding once instead of once per lane.

## 0.0.5

### Patch Changes

- 5e76f8c: The masonry fallback keeps every lane holding an item while it measures lanes of different widths, so `repeat(auto-fit, ...)` columns whose tracks round to fractional widths no longer collapse and leave gaps.

## 0.0.4

### Patch Changes

- d77de64: The masonry fallback measures items in their own lane under `repeat(auto-fit, ...)` columns instead of across the whole width, and reads a percentage row gap as no gap, as native grid lanes do.

## 0.0.3

### Patch Changes

- 8ce6da0: Children taken out of the flow, such as an absolutely positioned spinner, no longer take a place in a justified row or a masonry lane. The React components run on React 18 as well as 19.

## 0.0.2

### Patch Changes

- 4203e9f: Add the gallery package: `createJustifiedGallery` lays pictures out in rows that keep their proportions and fill the width, and `createMasonry` stacks items into columns with native `display: grid-lanes` where the browser has it and a matching fallback elsewhere. The React entry adds `JustifiedGallery`, `Masonry`, `useJustifiedGallery` and `useMasonry`.
