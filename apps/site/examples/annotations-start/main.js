import { createAnnotatedImage } from "@reuse-sh/annotations";
import { enhanceAvatar } from "@reuse-sh/avatars";

const root = document.querySelector(".re-example");
const image = createAnnotatedImage(
  root.querySelector(".re-example > div") ?? root,
  {
    src: "https://reuse.sh/images/marble-lake.svg",
    alt: "A soft marble texture in coral, sand and blue, with three annotations",
    width: 1600,
    height: 1200,
    annotations: [
      { kind: "area", box: [12, 19, 32, 36], label: "A quieter corner" },
      { kind: "arrow", line: [70, 68, 48, 50] },
      {
        kind: "marker",
        point: [76, 26],
        text: "Keep <strong>context</strong> beside the image.",
      },
    ],
  },
);
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
