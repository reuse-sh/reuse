import { createAvatarGroup, enhanceAvatar } from "@reuse-sh/avatars";

const controllers = [...document.querySelectorAll("[data-re-avatar]")].map(
  (root) => enhanceAvatar(root),
);
controllers.push(
  createAvatarGroup(document.querySelector("[data-group]"), {
    overlap: 12,
  }),
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.reverse().forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
