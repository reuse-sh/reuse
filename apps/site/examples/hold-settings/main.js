import { createHoldToConfirm } from "@reuse-sh/interactions";

const button = document.querySelector(".re-hold");
let held = false;
let pending = null;
const down = (event) => {
  if (event.key === "Enter" || event.key === " ") held = true;
};
const up = () => {
  held = false;
  if (pending) {
    pending.focus();
    pending = null;
  }
};
document.addEventListener("keydown", down, true);
document.addEventListener("keyup", up, true);
const focusAfterRelease = (target) => {
  if (held) pending = target;
  else target.focus();
};
const undo = document.querySelector("#undo");
const status = document.querySelector('[role="status"]');
const change = (done) => {
  button.hidden = done;
  undo.hidden = !done;
  status.textContent = done
    ? "Scheduled. Everything is removed in 7 days."
    : "Removes every print, order and member after 7 days.";
  focusAfterRelease(done ? undo : button);
};
const controller = createHoldToConfirm(button, {
  holdMs: 2000,
  onConfirm() {
    change(true);
  },
});
button.disabled = false;
const restore = () => {
  controller.reset();
  change(false);
};
undo.addEventListener("click", restore);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  undo.removeEventListener("click", restore);
  document.removeEventListener("keydown", down, true);
  document.removeEventListener("keyup", up, true);
  window.removeEventListener("pagehide", cleanup);
});
