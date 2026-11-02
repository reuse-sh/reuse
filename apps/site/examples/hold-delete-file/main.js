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
const row = document.querySelector(".re-hold-delete-file-x-file");
const gone = document.querySelector(".re-hold-delete-file-x-file-gone");
const undo = document.querySelector("#undo");
const change = (done) => {
  row.hidden = done;
  gone.hidden = !done;
  focusAfterRelease(done ? undo : button);
};
const controller = createHoldToConfirm(button, {
  holdMs: 1200,
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
