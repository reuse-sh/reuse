import { carouselStyles, mountCarouselStyle } from "./carousel-styles.js";
import { createSegmentHighlights } from "./segment-highlight.js";

const root = document.querySelector(".re-cc");
const group = root.querySelector("fieldset");
const demo = root.querySelector(".re-cc-demo");
const note = root.querySelector(".re-cc-note");
let destroy = mountCarouselStyle(demo, "Dots");
group.disabled = false;
const unhighlight = createSegmentHighlights(group);
function change(event) {
  const input = event.target;
  const style = carouselStyles.find((entry) => entry.name === input.value);
  if (!style) return;
  destroy();
  destroy = mountCarouselStyle(demo, style.name);
  for (const label of group.querySelectorAll("label"))
    label.toggleAttribute("data-current", label.contains(input));
  const title = document.createElement("b");
  title.textContent = `${style.name}.`;
  note.replaceChildren(title, ` ${style.note}`);
  input.parentElement.scrollIntoView({ block: "nearest", inline: "nearest" });
}
group.addEventListener("change", change);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  destroy();
  unhighlight();
  group.disabled = true;
  group.removeEventListener("change", change);
  window.removeEventListener("pagehide", cleanup);
});
