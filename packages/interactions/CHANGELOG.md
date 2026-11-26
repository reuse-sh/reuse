# @reuse-sh/interactions

## 0.3.0

### Minor Changes

- b825cc3: Add Cursor preview: a picture of each item that follows the pointer, leans with its speed and crossfades between items. Use `createCursorPreview` or the `CursorPreview` React component.
- 9982302: Floating tooltip grows in from the pointer corner, rolls the next hint in from the direction of travel instead of dimming it, and shrinks slightly as it fades out.

## 0.2.1

### Patch Changes

- 00fc810: A floating tooltip held to its trigger on x, such as one beside a side rail, now leans as the pointer moves vertically, from the edge it hangs on. `createFloatingTooltipMotion` takes `tilt.axis` to lean with vertical travel.

## 0.2.0

### Minor Changes

- 976cc88: Expose the floating tooltip's positioning and motion for applications that render their own popup. Resolve a position from any reference point, snap either axis to a shared anchor, and keep the same spring and tilt with framework-owned content.

## 0.1.2

### Patch Changes

- 2e84f26: Fade the floating tooltip from its current tilt and reverse the fade when the pointer returns. Open at the latest pointer position, dismiss hints for unavailable triggers, refresh updated content, give nested triggers one owner, and keep the tooltip inside the viewport as it resizes.

## 0.1.1

### Patch Changes

- 27698f0: A floating tooltip follows only the pointer that opened it, and hold to confirm lets go only on the holding pointer's release. Another pointer on the page, such as a scripted demo cursor or a second touch, no longer moves or closes an open tooltip or cancels a hold in progress. A scripted pointer cannot take over a tooltip the visitor's pointer opened, while the visitor's pointer still takes over by entering another trigger.
- 27698f0: A floating tooltip keeps rich content in place when `content` returns the node it already shows. Before, any scroll or page change re-inserted that node, which reset scroll positions and restarted animations inside live content.

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
