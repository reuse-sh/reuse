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
const form = document.querySelector(".re-compose");
const send = form.querySelector("button");
send.disabled = false;
const submit = (event) => {
  event.preventDefault();
  const input = form.elements.namedItem("message");
  if (!input.value.trim()) return;
  const message = document.createElement("p");
  message.className = "re-mine";
  message.textContent = input.value;
  document.querySelector("[data-messages]").append(message);
  form.reset();
};
form.addEventListener("submit", submit);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  form.removeEventListener("submit", submit);
  send.disabled = true;
  window.removeEventListener("pagehide", cleanup);
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  galleries.forEach((gallery) => {
    gallery.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
const contacts = [...document.querySelectorAll(".re-contact")];
contacts.forEach((button, index) => {
  button.disabled = false;
  button.setAttribute("aria-current", String(index === 0));
});
const choose = (event) => {
  const button = event.target.closest(".re-contact");
  if (button)
    contacts.forEach((contact) => {
      contact.setAttribute("aria-current", String(contact === button));
    });
};
const list = document.querySelector(".re-chat aside");
list.addEventListener("click", choose);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  list.removeEventListener("click", choose);
  contacts.forEach((button) => {
    button.disabled = true;
  });
  window.removeEventListener("pagehide", cleanup);
});
