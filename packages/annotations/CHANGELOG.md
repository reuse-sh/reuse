# @reuse-sh/annotations

## 0.1.0

### Minor Changes

- 98c181c: The editor draws one frame: a selected area or line keeps its own outline with handles on its corners and ends, instead of a second frame around it. A new `onPreview` option reports the marks while a drag reshapes them, and the React `AnnotationEditor` uses it, so the mark itself follows the drag.

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
