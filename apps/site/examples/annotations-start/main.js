import { createAnnotatedImage } from "@reuse-sh/annotations";

const annotations = [
  {
    kind: "area",
    box: [8, 12, 30, 34],
    label: "Bands too tight",
  },
  {
    kind: "pointer",
    point: [74, 24],
    label: "Keep this orange",
    side: "auto",
  },
  {
    kind: "marker",
    point: [24, 62],
    text: "Lift the <strong>blue</strong>",
  },
];
const root = document.querySelector(".re-example");
const options = {
  src: "https://reuse.sh/images/marble-lake.svg",
  alt: "A soft marble texture in coral, sand and blue",
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
