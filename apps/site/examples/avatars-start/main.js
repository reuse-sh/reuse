import { enhanceAvatar } from "@reuse-sh/avatars";

const controllers = [...document.querySelectorAll("[data-re-avatar]")].map(
  (root) => enhanceAvatar(root),
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.reverse().forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
