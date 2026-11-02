import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector(".re-example"), {
  className: "re-tooltip-start-popup",
});
const highlight = createMovingHighlight(
  document.querySelector(".re-tooltip-start-c-toolbar"),
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  tooltip.destroy();
  highlight.destroy();
  window.removeEventListener("pagehide", cleanup);
});
