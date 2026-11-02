import { createCarousel } from "@reuse-sh/carousel";
import { createFadeEdge } from "@reuse-sh/gradients";
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
const strip = document.querySelector(".re-fade-strip");
const carousel = createCarousel(strip, {
  align: "start",
});
const fade = createFadeEdge(strip, {
  size: 64,
});
const controls = document.querySelector(".re-controls");
function change() {
  syncChoices();
  fade.update({
    mode: controls.querySelector('[name="fade-mode"]:checked').value,
    curve: controls.querySelector('[name="fade-curve"]:checked').value,
  });
}
controls.addEventListener("change", change);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controls.removeEventListener("change", change);
  fade.destroy();
  carousel.destroy();
  for (const highlight of highlights) highlight.destroy();
  window.removeEventListener("pagehide", cleanup);
});
