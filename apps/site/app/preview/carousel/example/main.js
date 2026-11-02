import { createCarousel } from "@reuse-sh/carousel";

const viewport = document.querySelector("[data-prints]");
const previous = document.querySelector("[data-previous]");
const next = document.querySelector("[data-next]");
const counter = document.querySelector("[data-counter]");
const carousel = createCarousel(viewport);

function render(state) {
  counter.textContent = `${state.index + 1} / ${state.count}`;
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
}

const goPrevious = () => carousel.prev();
const goNext = () => carousel.next();
const unsubscribe = carousel.subscribe(render);
previous.addEventListener("click", goPrevious);
next.addEventListener("click", goNext);
render(carousel.getState());

function cleanup(event) {
  if (event.persisted) return;
  previous.removeEventListener("click", goPrevious);
  next.removeEventListener("click", goNext);
  window.removeEventListener("pagehide", cleanup);
  unsubscribe();
  carousel.destroy();
  previous.disabled = true;
  next.disabled = true;
}

window.addEventListener("pagehide", cleanup);
