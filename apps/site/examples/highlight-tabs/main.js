import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector("#highlight");
const controller = createMovingHighlight(root, {
  mode: "selected",
  className: "re-tab-fill",
});
const hover = createMovingHighlight(root, {
  mode: "hover",
  selectedSelector: "[data-none]",
  className: "re-tab-hover",
});
const buttons = Array.from(root.querySelectorAll("button"));
const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
let selected = 0;
const select = (index) => {
  selected = index;
  buttons.forEach((button, i) => {
    button.tabIndex = i === index ? 0 : -1;
    button.setAttribute("aria-selected", String(i === index));
    panels[i].hidden = i !== index;
  });
};
const click = (event) => {
  const index = buttons.indexOf(event.target.closest("button"));
  if (index < 0) return;
  select(index);
};
const focus = (event) => {
  const index = buttons.indexOf(event.target);
  if (index >= 0) select(index);
};
const keydown = (event) => {
  const moves = {
    ArrowRight: selected + 1,
    ArrowLeft: selected - 1,
    Home: 0,
    End: buttons.length - 1,
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  const next = (moves[event.key] + buttons.length) % buttons.length;
  select(next);
  buttons[next].focus();
};
root.addEventListener("click", click);
root.addEventListener("keydown", keydown);
root.addEventListener("focusin", focus);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  hover.destroy();
  root.removeEventListener("click", click);
  root.removeEventListener("keydown", keydown);
  root.removeEventListener("focusin", focus);
  window.removeEventListener("pagehide", cleanup);
});
