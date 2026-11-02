import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector(".re-highlight-tabs-x-tabs");
const fill = createMovingHighlight(root, {
  rowSelector: '[role="tab"]',
  selectedSelector: '[aria-selected="true"]',
  mode: "selected",
  className: "re-highlight-tabs-x-tab-fill",
});
const hover = createMovingHighlight(root, {
  rowSelector: '[role="tab"]',
  selectedSelector: "[data-none]",
  mode: "hover",
  className: "re-highlight-tabs-x-tab-hover",
});
const buttons = [...root.querySelectorAll("button")];
const panel = document.querySelector('[role="tabpanel"]');
const texts = [
  "Nine prints, two waiting for review. The next proof ships on Friday.",
  "Coral sky, Mint and ember, Lilac bloom and six more, in print order.",
  "14 orders this week. Three are framed and wait for the courier.",
  "Who can see the series, how prints are named, and where proofs go.",
];
let selected = 0;
const select = (index) => {
  selected = index;
  buttons.forEach((button, i) => {
    button.tabIndex = i === index ? 0 : -1;
    button.setAttribute("aria-selected", String(i === index));
  });
  panel.textContent = texts[index];
  panel.setAttribute("aria-labelledby", buttons[index].id);
};
const click = (event) => {
  const index = buttons.indexOf(event.target.closest("button"));
  if (index >= 0) select(index);
};
const keydown = (event) => {
  const moves = {
    ArrowLeft: selected - 1,
    ArrowRight: selected + 1,
    Home: 0,
    End: buttons.length - 1,
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  const index = (moves[event.key] + buttons.length) % buttons.length;
  select(index);
  buttons[index].focus();
};
root.addEventListener("click", click);
root.addEventListener("keydown", keydown);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  fill.destroy();
  hover.destroy();
  root.removeEventListener("click", click);
  root.removeEventListener("keydown", keydown);
  window.removeEventListener("pagehide", cleanup);
});
