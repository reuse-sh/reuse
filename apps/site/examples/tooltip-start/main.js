import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector(".re-example"));
const highlight = createMovingHighlight(document.querySelector(".re-toolbar"));
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  tooltip.destroy();
  highlight.destroy();
  window.removeEventListener("pagehide", cleanup);
});
