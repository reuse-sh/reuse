import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector(".re-highlight-navigation-x-nav");
const controller = createMovingHighlight(root);
const links = [...root.querySelectorAll("a")];
const summaries = ["24 prints", "8 prints", "5 prints", "6 people", "2 drafts"];
const select = (event) => {
  const link = event.target.closest("a");
  const index = links.indexOf(link);
  if (index < 0) return;
  event.preventDefault();
  links.forEach((row, i) => {
    row.toggleAttribute("data-current", i === index);
    if (i === index) row.setAttribute("aria-current", "page");
    else row.removeAttribute("aria-current");
  });
  document.querySelector(".re-highlight-navigation-x-nav-heading").textContent =
    link.querySelector("span:nth-child(2)").textContent;
  document.querySelector(".re-highlight-navigation-x-nav-summary").textContent =
    summaries[index];
};
root.addEventListener("click", select);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controller.destroy();
  root.removeEventListener("click", select);
  window.removeEventListener("pagehide", cleanup);
});
