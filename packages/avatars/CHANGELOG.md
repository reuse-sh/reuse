# @reuse-sh/avatars

## 0.0.4

### Patch Changes

- b118549: Icon badges are now a circle of the badge size instead of a wider pill.
- d2eaadb: Badge and group cutouts are now vector clip paths instead of SVG mask images, so their edges stay sharp in Safari and on iOS when the page is zoomed. In a group, an avatar's badge is now cut around the next avatar together with its face.

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
