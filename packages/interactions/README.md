# @reuse-sh/interactions

Three small interactions: a floating tooltip shared by nearby triggers, a moving highlight that follows hover and keyboard focus, and a hold-to-confirm button. Each works on plain DOM and has a React wrapper.

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
```

Tooltip triggers use `data-reuse-tooltip="Description"`. Highlight rows use `data-reuse-row`, and the selected row has `data-current`.

## React

```tsx
import {
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
  <button data-reuse-row data-current>Overview</button>
  <button data-reuse-row>Examples</button>
</MovingHighlight>

<HoldToConfirmButton holdMs={1200} onConfirm={removeDraft}>
  Hold to remove
</HoldToConfirmButton>
```

## Documentation

- Floating tooltip: https://reuse.sh/floating-tooltip, agent guide https://reuse.sh/floating-tooltip/guide.md
- Moving highlight: https://reuse.sh/moving-highlight, agent guide https://reuse.sh/moving-highlight/guide.md
- Hold to confirm: https://reuse.sh/hold-to-confirm, agent guide https://reuse.sh/hold-to-confirm/guide.md

## License

MIT
