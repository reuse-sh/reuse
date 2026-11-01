# @reuse-sh/interactions

Four small interactions: a floating tooltip shared by nearby triggers, a moving highlight that follows hover and keyboard focus, a hold-to-confirm button, and a copy button. Each works on plain DOM and has a React wrapper.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

### Floating tooltip

- **Share one popup.** Nearby triggers share one tooltip, so moving along a toolbar slides it across instead of closing and reopening it.
- **Follow the pointer on a spring.** It trails the pointer with a little weight, below and to the right, and never jumps.
- **Anchor to keyboard focus.** Keyboard focus places it on the element, and Escape hides it.
- **Treat touch as touch.** A touch is not hover, so touch input never opens it.
- **Hold only a hint.** It describes its trigger through aria-describedby and never holds controls or required instructions.
- **Stay inside the window.** It keeps a margin from every edge of the viewport.

### Moving highlight

- **Measure the real rows.** The background takes its size and place from the row itself, also inside scaled containers.
- **Let the keyboard lead.** Focus moves the background like the pointer does, and keyboard focus wins while it is active.
- **Keep selection apart.** In selected mode it stays on the selected row, and a second highlight on the same root can follow the pointer.
- **Follow layout changes.** Resizes and content changes move it to the row's new place.
- **Slide near, fade far.** Nearby rows slide in 150 ms, distant ones fade out and back in, and reduced motion snaps.
- **Skip disabled rows.** Disabled and hidden rows never take the highlight.

### Hold to confirm

- **Confirm once per hold.** A completed hold calls onConfirm exactly once, and the next action needs a new press.
- **Cancel on any doubt.** Letting go early, leaving the button, blur, Escape or disabling the button cancels the hold.
- **Accept pointer and keys.** A pointer, Space or Enter can hold, and keyboard auto-repeat never starts a new hold.
- **Let assistive technology click.** A click without a physical press, as from a screen reader, confirms at once.
- **Own the gesture, not the action.** Your code owns the request, the loading state, success and failure.
- **Keep the native button.** It enhances a button you already have and restores its markup on destroy.

### Copy button

- **Keep one timer.** Each result clears the pending reset before it starts a new one, and a slow earlier copy never overwrites a newer result.
- **Swap the icon in place.** The copy, check and error icons share one grid cell, so the state changes without moving the label or resizing the button.
- **Announce the result.** A polite live region beside the button says Copied or Copy failed, so screen reader users hear what happened.
- **Fall back when refused.** When the Clipboard API is missing or refused, it copies through a hidden selection, then restores the selection and focus it found.
- **Name an icon-only button.** A button with no text and no label gets the accessible name Copy.
- **Restore the button.** Destroy clears the timer, removes the icon, the status and the class and label it added, and puts back data-state.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/interactions
```

## Browser

```js
import {
  createFloatingTooltip,
  createMovingHighlight,
  createHoldToConfirm,
  createCopyButton,
} from "@reuse-sh/interactions";
import "@reuse-sh/interactions/styles.css";

const tooltip = createFloatingTooltip(toolbar, {
  side: "top",
  delay: 150,
});
const highlight = createMovingHighlight(menu);
const hold = createHoldToConfirm(button, {
  holdMs: 1200,
  onConfirm: () => removeDraft(),
});

const copy = createCopyButton(copyButton, {
  text: "npm install @reuse-sh/interactions",
});
```

Tooltip triggers use `data-re-tooltip="Description"`. Highlight rows use `data-re-row`, and the selected row has `data-current`. The copy button sets `data-state` to `idle`, `copied` or `error`, swaps its icon, and announces the result to screen readers. It returns to idle after `resetMs`, 1600 by default.

## React

```tsx
import {
  CopyButton,
  FloatingTooltip,
  FloatingTooltipGroup,
  HoldToConfirmButton,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import "@reuse-sh/interactions/styles.css";

<FloatingTooltipGroup>
  <FloatingTooltip content="Add an annotation">
    <button>Add</button>
  </FloatingTooltip>
</FloatingTooltipGroup>

<MovingHighlight>
  <button data-re-row data-current>Overview</button>
  <button data-re-row>Examples</button>
</MovingHighlight>

<HoldToConfirmButton holdMs={1200} onConfirm={removeDraft}>
  Hold to remove
</HoldToConfirmButton>

<CopyButton text="npm install @reuse-sh/interactions">Copy</CopyButton>
```

## Documentation

- Floating tooltip: https://reuse.sh/floating-tooltip, agent guide https://reuse.sh/floating-tooltip/guide.md
- Moving highlight: https://reuse.sh/moving-highlight, agent guide https://reuse.sh/moving-highlight/guide.md
- Hold to confirm: https://reuse.sh/hold-to-confirm, agent guide https://reuse.sh/hold-to-confirm/guide.md

## License

MIT
