# @reuse-sh/shadows

## 0.1.0

### Minor Changes

- 19f0180: Add optional Tailwind 4 stylesheets for shadow and gradient utilities, including theme colors, transparent endpoints, opacity modifiers and variants. Add framework-independent gradient CSS presets with direction and easing classes, preserving the existing JavaScript interfaces.

## 0.0.3

### Patch Changes

- ed02d8a: Breaking: the fade edge moved to @reuse-sh/gradients. Import `createFadeEdge` from `@reuse-sh/gradients` instead of `@reuse-sh/shadows`.
- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
