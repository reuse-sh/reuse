import { createCarousel } from "@reuse-sh/carousel";
import { bindLightboxGallery } from "@reuse-sh/lightbox";

const galleries = [...document.querySelectorAll("[data-gallery]")].map((root) =>
  bindLightboxGallery(root, {
    thumbnails: true,
    getItem: (image) => ({
      src: image.src,
      alt: image.alt,
      caption: image.dataset.caption,
      width: 1600,
      height: 1200,
      origin: image.closest("[hidden]") ? null : image,
      thumbnailSrc: image.src,
    }),
  }),
);
const root = document.querySelector(".re-example");
const carousel = createCarousel(root.querySelector(".re-carousel"), {
  loop: true,
});
const previous = root.querySelector("[data-prev]");
const next = root.querySelector("[data-next]");
const dots = [...root.querySelectorAll("[data-index]")];
const indicator = root.querySelector("[data-dots]");
const render = (state) => {
  indicator.style.setProperty("--re-c-dot", String(state.index));
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
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
  galleries.forEach((gallery) => {
    gallery.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
