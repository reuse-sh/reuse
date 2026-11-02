# @reuse-sh/carousel

## 0.1.0

### Minor Changes

- b118549: A released mouse drag now keeps its speed and glides to the slide nearest where it would stop, like trackpad momentum. Dragging past either end stretches the strip, and it springs back on release. A press that stops a moving strip no longer clicks the slide under it. The viewport shows a grab cursor while a mouse drag can move it. The lightbox gets the same dragging through its carousel and still moves one photo per flick.

### Patch Changes

- d2eaadb: A mouse drag past either end stretches less and stops growing at 120px, or 30% of a narrow strip, closer to trackpad overscroll.

## 0.0.4

### Patch Changes

- 73973fc: Read a percentage or `calc()` `scroll-padding-inline` correctly, so slides line up with the padded edge instead of the viewport edge.

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
