import { createCarousel } from "@reuse-sh/carousel";

const root = document.querySelector(".re-example");
const carousel = createCarousel(root.querySelector(".re-carousel"), {
  loop: false,
  group: "page",
});
const previous = root.querySelector("[data-prev]");
const next = root.querySelector("[data-next]");
const dots = [...root.querySelectorAll("[data-index]")];
const render = (state) => {
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
  root.querySelector(".re-counter").textContent =
    `${String(state.index + 1).padStart(2, "0")} / ${String(state.count).padStart(2, "0")}`;
  dots.forEach((dot, index) => {
    dot.disabled = false;
    dot.setAttribute("aria-current", String(index === state.index));
  });
};
const click = (event) => {
  const button = event.target.closest("button");
  if (!button || !root.contains(button)) return;
  if (button === previous) carousel.prev();
  else if (button === next) carousel.next();
  else if (button.hasAttribute("data-index"))
    carousel.goTo(Number(button.dataset.index));
};
root.addEventListener("click", click);
const unsubscribe = carousel.subscribe(render);
render(carousel.getState());
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  unsubscribe();
  root.removeEventListener("click", click);
  carousel.destroy();
  previous.disabled = true;
  next.disabled = true;
  dots.forEach((dot) => {
    dot.disabled = true;
  });
  window.removeEventListener("pagehide", cleanup);
});
