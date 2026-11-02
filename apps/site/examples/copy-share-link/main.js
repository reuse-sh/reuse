import { createCopyButton } from "@reuse-sh/interactions";

const buttons = [...document.querySelectorAll(".re-copy-button")];
const texts = ["https://prints.example/coral-sky"];
const controllers = buttons.map((button, index) => {
  const controller = createCopyButton(button, { text: texts[index] });
  button.disabled = false;
  return controller;
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
