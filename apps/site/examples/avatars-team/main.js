import { enhanceAvatar } from "@reuse-sh/avatars";
import { createMovingHighlight } from "@reuse-sh/interactions";

const controllers = [...document.querySelectorAll("[data-re-avatar]")].map(
  (root) => enhanceAvatar(root),
);
controllers.push(createMovingHighlight(document.querySelector(".re-members")));
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.reverse().forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
