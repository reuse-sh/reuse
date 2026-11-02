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
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  galleries.forEach((gallery) => {
    gallery.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
