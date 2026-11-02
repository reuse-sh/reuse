import { createAvatarGroup, enhanceAvatar } from "@reuse-sh/avatars";

const root = document.querySelector(".re-example");
const controllers = [...root.querySelectorAll("[data-re-avatar]")].map(
  enhanceAvatar,
);
for (const group of root.querySelectorAll(".re-avatar-group"))
  controllers.push(createAvatarGroup(group, { overlap: 12 }));
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  controllers.reverse().forEach((controller) => {
    controller.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
