import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector(".re-highlight-start-c-menu-card");
const controller = createMovingHighlight(root);
const buttons = [...root.querySelectorAll("button")];
const click = (event) => {
  const chosen = event.target.closest("button");
  if (!chosen) return;
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button === chosen));
    button.toggleAttribute("data-current", button === chosen);
  }
};
root.addEventListener("click", click);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  root.removeEventListener("click", click);
  window.removeEventListener("pagehide", cleanup);
});
