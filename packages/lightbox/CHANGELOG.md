# @reuse-sh/lightbox

## 0.0.5

### Patch Changes

- b118549: A released mouse drag now keeps its speed and glides to the slide nearest where it would stop, like trackpad momentum. Dragging past either end stretches the strip, and it springs back on release. A press that stops a moving strip no longer clicks the slide under it. The viewport shows a grab cursor while a mouse drag can move it. The lightbox gets the same dragging through its carousel and still moves one photo per flick.
- Updated dependencies [b118549]
- Updated dependencies [d2eaadb]
  - @reuse-sh/carousel@0.1.0

## 0.0.4

### Patch Changes

- Updated dependencies [73973fc]
  - @reuse-sh/carousel@0.0.4

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.
- Updated dependencies [ed02d8a]
  - @reuse-sh/carousel@0.0.3

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
- Updated dependencies [c3d63ba]
  - @reuse-sh/carousel@0.0.2
