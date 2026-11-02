# @reuse-sh/interactions

## 0.1.0

### Minor Changes

- 64d2adc: Hold to confirm keeps a confirmed button full for `resetMs` (1600 ms by default) and ignores presses until then, instead of emptying the fill when the press is released. The new `onReset` callback and `reset()` method end the confirmed state, and `data-confirmed` marks it for styling.

## 0.0.3

### Patch Changes

- ed02d8a: Add the copy button: `createCopyButton` and the React `CopyButton`.
- ed02d8a: Breaking: class names, custom properties and data attributes now start with `re-` instead of `reuse-` (for example `.re-carousel`, `--re-shadow-color`, `data-re-row`). Rename them in your markup and CSS when you upgrade.

## 0.0.2

### Patch Changes

- c3d63ba: Document the library's principles in its README.
