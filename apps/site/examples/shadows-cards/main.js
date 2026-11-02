import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector(".re-copy");
const controller = createCopyButton(button, {
  text: "npm install @reuse-sh/shadows",
});
button.disabled = false;
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  window.removeEventListener("pagehide", cleanup);
});
