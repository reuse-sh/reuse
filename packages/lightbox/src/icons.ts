// Icon paths from Hugeicons (MIT) and Lucide (ISC); their notices ship in ICONS-LICENSE.md.
const lens = "M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0M21 21l-4.35-4.35";

const icons = {
  close: {
    stroke: "1.5",
    paths: ["M18 6L6.00081 17.9992M17.9992 18L6 6.00085"],
  },
  previous: { stroke: "1.8", paths: ["m15 18-6-6 6-6"] },
  next: { stroke: "1.8", paths: ["m9 18 6-6-6-6"] },
  zoomIn: { stroke: "1.5", paths: [lens, "M11 8v6M8 11h6"] },
  zoomOut: { stroke: "1.5", paths: [lens, "M8 11h6"] },
  fullscreenEnter: {
    stroke: "1.5",
    paths: [
      "M15.5 21C16.8956 21 17.5933 21 18.1611 20.8278C19.4395 20.44 20.44 19.4395 20.8278 18.1611C21 17.5933 21 16.8956 21 15.5M21 8.5C21 7.10444 21 6.40666 20.8278 5.83886C20.44 4.56046 19.4395 3.56004 18.1611 3.17224C17.5933 3 16.8956 3 15.5 3M8.5 21C7.10444 21 6.40666 21 5.83886 20.8278C4.56046 20.44 3.56004 19.4395 3.17224 18.1611C3 17.5933 3 16.8956 3 15.5M3 8.5C3 7.10444 3 6.40666 3.17224 5.83886C3.56004 4.56046 4.56046 3.56004 5.83886 3.17224C6.40666 3 7.10444 3 8.5 3",
    ],
  },
  fullscreenExit: {
    stroke: "1.5",
    paths: [
      "M13 4L13 7.00002C13 8.88563 13.0001 9.82843 13.5858 10.4142C14.1716 11 15.1144 11 17 11L20 11",
      "M11.0001 20L11 17C11 15.1144 11 14.1715 10.4142 13.5858C9.82843 13 8.88563 13 7.00002 13L4.00006 13",
    ],
  },
  download: {
    stroke: "1.5",
    paths: [
      "M16.9504 12.1817C17.1981 12.814 16.5076 13.5726 15.1267 15.0899C13.6702 16.6902 12.9201 17.4904 12 17.5C11.0799 17.4904 10.3298 16.6902 8.87331 15.0899C7.49239 13.5726 6.80193 12.814 7.04964 12.1817C7.05868 12.1586 7.06851 12.1359 7.0791 12.1135C7.34928 11.542 8.24477 11.5029 10 11.5002V4.99998C10 4.53501 10 4.30253 10.0511 4.11179C10.1898 3.59414 10.5941 3.1898 11.1118 3.05111C11.3025 3 11.535 3 12 3C12.4649 3 12.6974 3 12.8882 3.05111C13.4058 3.1898 13.8102 3.59414 13.9489 4.11179C14 4.30253 14 4.53501 14 4.99998V11.5002C15.7552 11.5029 16.6507 11.542 16.9209 12.1135C16.9315 12.1359 16.9413 12.1586 16.9504 12.1817Z",
      "M5.00006 21H19.0001",
    ],
  },
  play: { stroke: "2", paths: ["M8 5v14l11-7z"] },
  pause: { stroke: "2", paths: ["M9 5v14m6-14v14"] },
};

export type BuiltInIcon = keyof typeof icons;

const svgNamespace = "http://www.w3.org/2000/svg";

export function showIcon(button: Element, name: BuiltInIcon) {
  const { stroke, paths } = icons[name];
  const shown = [...button.querySelectorAll("path")].map((path) =>
    path.getAttribute("d"),
  );
  if (shown.join(" ") === paths.join(" ")) return;
  const doc = button.ownerDocument;
  const svg = doc.createElementNS(svgNamespace, "svg");
  const attributes = {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": stroke,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  };
  for (const [key, value] of Object.entries(attributes))
    svg.setAttribute(key, value);
  if (name === "previous" || name === "next")
    svg.setAttribute("class", "re-lightbox-arrow-icon");
  for (const d of paths) {
    const path = doc.createElementNS(svgNamespace, "path");
    path.setAttribute("d", d);
    svg.append(path);
  }
  button.replaceChildren(svg);
}
