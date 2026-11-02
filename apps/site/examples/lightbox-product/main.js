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
const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
];
const root = document.querySelector(".re-example");
const buy = root.querySelector("[data-buy]");
let timer;
const change = (event) => {
  if (event.target.matches('input[name="size"]')) {
    const [label, price] = sizes[Number(event.target.value)];
    root.querySelector("[data-price]").textContent = price;
    root.querySelector("[data-paper]").textContent =
      `Archival paper · ${label} cm`;
  }
};
const add = () => {
  buy.textContent = "Added to bag";
  clearTimeout(timer);
  timer = setTimeout(() => {
    buy.textContent = "Add to bag";
  }, 1600);
};
root.addEventListener("change", change);
buy.addEventListener("click", add);
buy.disabled = false;
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  clearTimeout(timer);
  root.removeEventListener("change", change);
  buy.removeEventListener("click", add);
  buy.disabled = true;
  window.removeEventListener("pagehide", cleanup);
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  galleries.forEach((gallery) => {
    gallery.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
