const lens = "M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 4 4M8 11h6";

const paths = {
  close: "M6 6l12 12M18 6 6 18",
  previous: "m15 6-6 6 6 6",
  next: "m9 6 6 6-6 6",
  zoomIn: `${lens}M11 8v6`,
  zoomOut: lens,
  fullscreenEnter: "M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5",
  fullscreenExit: "M9 4v5H4m11-5v5h5m0 6h-5v5m-6 0v-5H4",
  download: "M12 4v11m-5-5 5 5 5-5M5 20h14",
  play: "M8 5v14l11-7z",
  pause: "M9 5v14m6-14v14",
};

export type BuiltInIcon = keyof typeof paths;

const svgNamespace = "http://www.w3.org/2000/svg";

export function showIcon(button: Element, name: BuiltInIcon) {
  const d = paths[name];
  if (button.querySelector("path")?.getAttribute("d") === d) return;
  const doc = button.ownerDocument;
  const svg = doc.createElementNS(svgNamespace, "svg");
  const attributes = {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "2",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  };
  for (const [key, value] of Object.entries(attributes))
    svg.setAttribute(key, value);
  if (name === "previous" || name === "next")
    svg.setAttribute("class", "re-lightbox-arrow-icon");
  const path = doc.createElementNS(svgNamespace, "path");
  path.setAttribute("d", d);
  svg.append(path);
  button.replaceChildren(svg);
}
