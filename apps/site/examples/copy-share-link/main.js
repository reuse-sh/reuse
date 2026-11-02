import { createCopyButton } from "@reuse-sh/interactions";

const button = document.querySelector("#copy");
const controller = createCopyButton(button, {
  text: "https://prints.example/coral-sky",
});
button.disabled = false;
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  window.removeEventListener("pagehide", cleanup);
});
