import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector("#highlight");
const controller = createMovingHighlight(root);
const links = Array.from(root.querySelectorAll("a"));
const panels = Array.from(document.querySelectorAll("section"));
const select = (index) => {
  links.forEach((link, i) => {
    link.toggleAttribute("data-current", i === index);
    if (i === index) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    panels[i].hidden = i !== index;
  });
};
const click = (event) => {
  const index = links.indexOf(event.target.closest("a"));
  if (index >= 0) select(index);
};
select(0);
root.addEventListener("click", click);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  root.removeEventListener("click", click);
  window.removeEventListener("pagehide", cleanup);
});
