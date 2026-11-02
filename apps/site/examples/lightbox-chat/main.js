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
const rows = root.querySelector(".re-list-rows");
const highlight = createMovingHighlight(rows);
const people = [...rows.querySelectorAll(".re-person")];
const choose = (event) => {
  const target = event.target.closest(".re-person");
  if (!target) return;
  for (const person of people) {
    person.toggleAttribute("data-current", person === target);
    if (person === target) person.setAttribute("aria-current", "true");
    else person.removeAttribute("aria-current");
  }
};
people.forEach((person) => {
  person.disabled = false;
});
rows.addEventListener("click", choose);
cleanups.push(() => {
  highlight.destroy();
  rows.removeEventListener("click", choose);
  people.forEach((person) => {
    person.disabled = true;
  });
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  cleanups.reverse().forEach((destroy) => {
    destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
