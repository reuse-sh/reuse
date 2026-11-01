import { createMovingHighlight } from "@reuse-sh/interactions";

/** A selected fill that moves only when the current item changes, and a separate hover fill. */
export function createSegmentHighlights(
  root: HTMLElement,
  selectedSelector = "[data-current]",
) {
  const selected = createMovingHighlight(root, {
    selectedSelector,
    mode: "selected",
    className: "c-seg-fill",
  });
  const hover = createMovingHighlight(root, {
    selectedSelector: "[data-re-none]",
    mode: "hover",
    className: "c-seg-hover",
  });
  return () => {
    hover.destroy();
    selected.destroy();
  };
}
