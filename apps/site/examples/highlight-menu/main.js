import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector(".re-highlight-menu-x-menu");
const controller = createMovingHighlight(root);
const buttons = Array.from(root.querySelectorAll("button"));
let selected = 0;
const select = (index) => {
  selected = index;
  buttons.forEach((button, i) => {
    button.tabIndex = i === index ? 0 : -1;
  });
};
const click = (event) => {
  const index = buttons.indexOf(event.target.closest("button"));
  if (index < 0) return;
  select(index);
  document.querySelector(".re-highlight-menu-x-menu-status").textContent =
    `Chose ${buttons[index].querySelector("span:nth-child(2)").textContent}`;
};
const focus = (event) => {
  const index = buttons.indexOf(event.target);
  if (index >= 0) select(index);
};
const keydown = (event) => {
  const moves = {
    ArrowDown: selected + 1,
    ArrowUp: selected - 1,
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
  root.removeEventListener("click", click);
  root.removeEventListener("keydown", keydown);
  root.removeEventListener("focusin", focus);
  window.removeEventListener("pagehide", cleanup);
});
