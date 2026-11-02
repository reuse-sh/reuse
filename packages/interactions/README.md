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
- **Hold the result.** A confirmed button keeps its fill and ignores presses until resetMs ends it. Releasing, blur or disabling it does not empty the fill early.
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

<!-- examples:start -->

## Usage

### Floating tooltip

[Documentation](https://reuse.sh/floating-tooltip/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/interactions/styles.css" layer(components);
```

#### Usage

Wrap one focusable trigger with FloatingTooltip, or place several data-re-tooltip triggers inside one FloatingTooltipGroup. The group shares a single moving popup.

```tsx
"use client";

import { FloatingTooltip } from "@reuse-sh/interactions/react";

export function SaveAction() {
  return <FloatingTooltip content="Save changes">
    <button type="button">Save</button>
  </FloatingTooltip>;
}
```

#### Integration

Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger. The React wrapper owns cleanup.

#### HTML + JavaScript

#### Usage

Put data-re-tooltip on focusable triggers inside the bound root. One createFloatingTooltip controller shares a moving popup across them.

```html
<div id="actions">
  <button type="button" data-re-tooltip="Save changes">Save</button>
</div>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/interactions/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector("#actions"));
```

#### Integration

Use real buttons and links as triggers. Keyboard focus reveals the same hint and Escape dismisses it. Tooltips add descriptions, so essential names and actions must stay on the trigger.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
tooltip.destroy();
```

### Moving highlight

[Documentation](https://reuse.sh/moving-highlight/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/interactions/styles.css" layer(components);
```

#### Usage

Mark each interactive row with data-re-row. MovingHighlight follows the pointer and keyboard focus and rests on the row marked data-current.

```tsx
"use client";

import { MovingHighlight } from "@reuse-sh/interactions/react";

export function Navigation() {
  return <MovingHighlight className="flex flex-col gap-1">
    <a className="rounded-lg p-2" data-re-row data-current href="/inbox" aria-current="page">Inbox</a>
    <a className="rounded-lg p-2" data-re-row href="/archive">Archive</a>
  </MovingHighlight>;
}
```

#### Integration

Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding. The React wrapper destroys its background on unmount.

#### HTML + JavaScript

#### Usage

Mark each interactive row with data-re-row. MovingHighlight follows the pointer and keyboard focus and rests on the row marked data-current.

```html
<nav id="navigation" aria-label="Workspace">
  <a data-re-row data-current href="/inbox" aria-current="page">Inbox</a>
  <a data-re-row href="/archive">Archive</a>
</nav>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/interactions/styles.css";

#navigation { display: grid; gap: 0.25rem; }
#navigation a { padding: 0.5rem; border-radius: 0.5rem; }
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createMovingHighlight } from "@reuse-sh/interactions";

const highlight = createMovingHighlight(document.querySelector("#navigation"));
```

#### Integration

Moving highlight adds a background and measures existing rows. It does not implement menu or tab keyboard behavior. Keep native focusable elements, a visible focus outline and the correct interaction model for your navigation. Reduced motion snaps instead of sliding.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
highlight.destroy();
```

### Hold to confirm

[Documentation](https://reuse.sh/hold-to-confirm/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/interactions/styles.css" layer(components);
```

#### Usage

Use a native button and let onConfirm perform the action. The package owns the hold gesture and confirmation fill, while your application owns the result.

```tsx
"use client";

import { HoldToConfirmButton } from "@reuse-sh/interactions/react";

export function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return <HoldToConfirmButton className="rounded-lg px-4 py-2" holdMs={1200} onConfirm={onDelete}>
    Hold to delete
  </HoldToConfirmButton>;
}
```

#### Integration

A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages. Without JavaScript the native example remains disabled rather than offering an unprotected action.

#### HTML + JavaScript

#### Usage

Use a native button and let onConfirm perform the action. The package owns the hold gesture and confirmation fill, while your application owns the result.

```html
<button id="delete" type="button" disabled>Hold to delete</button>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/interactions/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector("#delete");
const result = document.createElement("p");
result.setAttribute("role", "status");
button.after(result);
const hold = createHoldToConfirm(button, {
  onConfirm: () => { result.textContent = "Deletion confirmed. Send your application request here."; },
});
button.disabled = false;
```

#### Integration

A pointer, Space or Enter must stay held; leaving, Escape or an early release cancels. Assistive-technology clicks can confirm immediately. The controller confirms once and holds its fill until resetMs expires. Your application owns permission checks, requests and failure messages. Without JavaScript the native example remains disabled rather than offering an unprotected action.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
hold.destroy();
button.disabled = true;
result.remove();
```

### Copy button

[Documentation](https://reuse.sh/copy-button/getting-started)

#### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/interactions/styles.css" layer(components);
```

#### Usage

Pass text for a fixed value or getText for a value read at click time. The button keeps its label while the icon changes after success or failure.

```tsx
"use client";

import { CopyButton } from "@reuse-sh/interactions/react";

export function InstallCommand() {
  return <div className="flex items-center gap-3">
    <code>npm install @reuse-sh/interactions</code>
    <CopyButton text="npm install @reuse-sh/interactions">Copy command</CopyButton>
  </div>;
}
```

#### Integration

The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use. React owns controller cleanup.

#### HTML + JavaScript

#### Usage

Pass text for a fixed value or getText for a value read at click time. The button keeps its label while the icon changes after success or failure.

```html
<code id="command">npm install @reuse-sh/interactions</code>
<button id="copy" type="button" hidden>Copy command</button>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/interactions/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector("#copy");
const copy = createCopyButton(button, {
  getText: () => document.querySelector("#command").textContent,
});
button.hidden = false;
```

#### Integration

The package provides copy, success and error icons plus a polite status announcement. It falls back to a temporary selection if the Clipboard API is unavailable or refused. Keep the source text selectable for no-JavaScript use.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
copy.destroy();
button.hidden = true;
```

<!-- examples:end -->

## Documentation

- Floating tooltip: https://reuse.sh/floating-tooltip, agent guide https://reuse.sh/floating-tooltip/guide.md
- Moving highlight: https://reuse.sh/moving-highlight, agent guide https://reuse.sh/moving-highlight/guide.md
- Hold to confirm: https://reuse.sh/hold-to-confirm, agent guide https://reuse.sh/hold-to-confirm/guide.md

## License

MIT
