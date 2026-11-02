import { createLightbox } from "@reuse-sh/lightbox";
import { lightboxIcons } from "./icons.js";

const root = document.querySelector(".re-example");
const lightbox = createLightbox({
  thumbnails: true,
  icons: lightboxIcons,
  className: "re-lightbox-demo",
});
const open = (event) => {
  const trigger = event.target.closest("[data-photo]");
  if (
    !trigger ||
    !root.contains(trigger) ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  const group =
    trigger.closest("[data-photo-group]") ?? trigger.closest("[data-gallery]");
  const triggers = [...group.querySelectorAll("[data-photo]")];
  const items = triggers.map((anchor) => {
    const image = anchor.querySelector("img");
    return {
      src: anchor.href,
      alt: image.alt,
      caption: anchor.getAttribute("aria-label").replace(/^Open /, ""),
      width: 1600,
      height: 1200,
      thumbnailSrc: anchor.href,
      previewSrc: image.currentSrc || image.src,
      origin: anchor.hidden ? null : image,
    };
  });
  lightbox.open(items, triggers.indexOf(trigger));
};
root.addEventListener("click", open);
const cleanups = [
  () => root.removeEventListener("click", open),
  () => lightbox.destroy(),
];
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  cleanups.reverse().forEach((destroy) => {
    destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
