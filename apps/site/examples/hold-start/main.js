import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector(".re-hold");
const labels = button.querySelectorAll(".re-hold-start-c-hold-label > span");
const status = document.querySelector('[role="status"]');
let timer;
const show = (done) => {
  labels[0].toggleAttribute("aria-hidden", done);
  labels[1].toggleAttribute("aria-hidden", !done);
  status.textContent = done ? "Deleted" : "";
};
const controller = createHoldToConfirm(button, {
  onConfirm() {
    button.setAttribute("aria-disabled", "true");
    button.setAttribute("data-done", "");
    show(true);
    clearTimeout(timer);
    timer = setTimeout(() => {
      button.removeAttribute("aria-disabled");
      button.removeAttribute("data-done");
      show(false);
      controller.reset();
    }, 2400);
  },
});
button.disabled = false;
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  clearTimeout(timer);
  controller.destroy();
  window.removeEventListener("pagehide", cleanup);
});
