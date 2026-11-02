import { createFloatingTooltip } from "@reuse-sh/interactions";

const tooltip = createFloatingTooltip(document.querySelector(".re-example"), {
  className: "re-tooltip-people-popup",
});

window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  tooltip.destroy();
  window.removeEventListener("pagehide", cleanup);
});
