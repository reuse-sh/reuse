import { createAnnotatedImage } from "@reuse-sh/annotations";

const annotations = [
  {
    kind: "area",
    box: [7, 10, 30, 32],
    label: "Bands too tight",
  },
  {
    kind: "spotlight",
    box: [56, 50, 28, 32],
  },
  {
    kind: "arrow",
    line: [38, 82, 54, 68],
  },
  {
    kind: "line",
    line: [8, 90, 44, 90],
  },
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
];
const root = document.querySelector(".re-example");
const options = {
  src: "https://reuse.sh/images/marble-mountains.svg",
  alt: "A soft marble texture in mint, blue and orange",
  width: 1600,
  height: 1200,
};
const image = createAnnotatedImage(root.querySelector("[data-image]"), {
  ...options,
  annotations,
});
window.addEventListener("pagehide", function cleanup(event) {
  if (event.persisted) return;
  image.destroy();
  window.removeEventListener("pagehide", cleanup);
});
