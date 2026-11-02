import { createCarousel } from "@reuse-sh/carousel";

const root = document.querySelector(".re-example");
const carousel = createCarousel(root.querySelector(".re-carousel"), {
  loop: false,
  group: "page",
});
const previous = root.querySelector("[data-prev]");
const next = root.querySelector("[data-next]");
const render = (state) => {
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
};
const click = (event) => {
  const button = event.target.closest("button");
  if (!button || !root.contains(button)) return;
  if (button === previous) carousel.prev();
  else if (button === next) carousel.next();
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
  window.removeEventListener("pagehide", cleanup);
});
