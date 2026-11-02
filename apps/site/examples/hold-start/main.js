import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector("#hold");
const undo = document.querySelector("#undo");
const status = document.querySelector("#status");
const controller = createHoldToConfirm(button, {
  holdMs: 1200,
  onConfirm() {
    status.textContent = "Confirmed.";
    button.disabled = true;
    undo.hidden = false;
  },
});
button.disabled = false;
const restore = () => {
  controller.reset();
  status.textContent =
    "Release early, move off the button or press Esc to cancel.";
  button.disabled = false;
  undo.hidden = true;
  button.focus();
};
undo.addEventListener("click", restore);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  undo.removeEventListener("click", restore);
  window.removeEventListener("pagehide", cleanup);
});
