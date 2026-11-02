import { createAnnotatedImage } from "@reuse-sh/annotations";
import { enhanceAvatar } from "@reuse-sh/avatars";

const root = document.querySelector(".re-example");
const image = createAnnotatedImage(root.querySelector(".re-annot") ?? root, {
  src: "https://reuse.sh/images/marble-mountains.svg",
  alt: "A soft marble texture in mint, blue and orange, with six review notes",
  width: 1600,
  height: 1200,
  annotations: [
    { kind: "area", box: [7, 10, 30, 32], label: "Bands too tight" },
    { kind: "spotlight", box: [56, 50, 28, 32] },
    { kind: "arrow", line: [38, 82, 54, 68] },
    { kind: "line", line: [8, 90, 44, 90] },
    {
      kind: "pointer",
      point: [76, 24],
      label: "Keep this orange",
      side: "auto",
    },
    {
      kind: "marker",
      point: [24, 60],
      text: "Lift the <strong>blue</strong> one step",
    },
  ],
});
const avatars = [...root.querySelectorAll("[data-re-avatar]")].map(
  enhanceAvatar,
);
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  image.destroy();
  avatars.forEach((avatar) => {
    avatar.destroy();
  });
  window.removeEventListener("pagehide", cleanup);
});
