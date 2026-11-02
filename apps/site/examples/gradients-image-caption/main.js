import { easingGradient } from "@reuse-sh/gradients";
import { createMovingHighlight } from "@reuse-sh/interactions";

const highlights = [];
for (const group of document.querySelectorAll(".re-choices")) {
  highlights.push(
    createMovingHighlight(group, {
      mode: "selected",
      className: "re-choice-selected",
    }),
    createMovingHighlight(group, {
      mode: "hover",
      selectedSelector: "[data-none]",
      className: "re-choice-hover",
    }),
  );
  group.dataset.enhanced = "";
  for (const input of group.querySelectorAll("input")) input.disabled = false;
}
function syncChoices() {
  for (const label of document.querySelectorAll(".re-choices label")) {
    if (label.querySelector("input").checked)
      label.setAttribute("data-current", "");
    else label.removeAttribute("data-current");
  }
}
const caption = document.querySelector(".re-caption figcaption");
const group = document.querySelector(".re-choices");
function change() {
  syncChoices();
  caption.style.backgroundImage = easingGradient({
    to: "rgb(0 0 0 / 0.6)",
    easing:
      group.querySelector(":checked").value === "linear"
        ? "linear"
        : "ease-in-out-sine",
  });
}
group.addEventListener("change", change);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  group.removeEventListener("change", change);
  for (const highlight of highlights) highlight.destroy();
  window.removeEventListener("pagehide", cleanup);
});
