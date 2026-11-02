import { createAvatarGroup, enhanceAvatar } from "@reuse-sh/avatars";
import { createMovingHighlight } from "@reuse-sh/interactions";

const root = document.querySelector(".re-example");
const controllers = [...root.querySelectorAll("[data-re-avatar]")].map(
  enhanceAvatar,
);
for (const group of root.querySelectorAll(".re-avatar-group"))
  controllers.push(createAvatarGroup(group, { overlap: 12 }));
controllers.push(createMovingHighlight(root.querySelector(".re-members")));
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.reverse().forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
