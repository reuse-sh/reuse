import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector(".re-example"), {
  className: "re-tooltip-shortcuts-popup",
});
const highlight = createMovingHighlight(
  document.querySelector(".re-tooltip-shortcuts-c-toolbar"),
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  tooltip.destroy();
  highlight.destroy();
  window.removeEventListener("pagehide", cleanup);
});
