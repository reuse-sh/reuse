import { enhanceAvatar } from "@reuse-sh/avatars";
import { createMovingHighlight } from "@reuse-sh/interactions";
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
const avatars = [...root.querySelectorAll("[data-re-avatar]")].map(
  enhanceAvatar,
);
cleanups.push(() =>
  avatars.forEach((avatar) => {
    avatar.destroy();
  }),
);
const segments = root.querySelector(".re-sizes");
const selected = createMovingHighlight(segments, {
  selectedSelector: "[data-current]",
  mode: "selected",
  className: "re-seg-fill",
});
const hover = createMovingHighlight(segments, {
  selectedSelector: "[data-re-none]",
  mode: "hover",
  className: "re-seg-hover",
});
const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
];
const radios = [...segments.querySelectorAll("input")];
const change = (event) => {
  const index = radios.indexOf(event.target);
  if (index < 0) return;
  const [label, cost] = sizes[index];
  root.querySelector(".re-price > span").textContent = cost;
  root.querySelector(".re-meta").textContent = `Archival paper · ${label} cm`;
  radios.forEach((radio) => {
    radio.parentElement.toggleAttribute("data-current", radio.checked);
  });
};
segments.addEventListener("change", change);
const buy = root.querySelector(".re-buy");
let timer;
const add = () => {
  buy.textContent = "Added to bag";
  buy.setAttribute("data-done", "");
  clearTimeout(timer);
  timer = setTimeout(() => {
    buy.textContent = "Add to bag";
    buy.removeAttribute("data-done");
  }, 1600);
};
buy.disabled = false;
buy.addEventListener("click", add);
cleanups.push(() => {
  clearTimeout(timer);
  selected.destroy();
  hover.destroy();
  segments.removeEventListener("change", change);
  buy.removeEventListener("click", add);
  buy.disabled = true;
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  cleanups.reverse().forEach((destroy) => {
    destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
