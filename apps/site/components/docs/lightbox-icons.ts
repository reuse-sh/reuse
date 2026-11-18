import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ZoomInAreaIcon from "@hugeicons/core-free-icons/ZoomInAreaIcon";
import { arrowPaths } from "../lucide-arrows";

type IconData = readonly (readonly [string, Record<string, string>])[];

const svgAttributes =
  'width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"';

function hugeicon(data: IconData) {
  const parts = data.map(
    ([tag, attributes]) =>
      `<${tag} ${Object.entries(attributes)
        .filter(([key]) => key !== "key")
        .map(
          ([key, value]) =>
            `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}="${value}"`,
        )
        .join(" ")}/>`,
  );
  return `<svg ${svgAttributes}>${parts.join("")}</svg>`;
}

const arrow = (path: string) =>
  `<svg ${svgAttributes} stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;

/** The SVG icons the style previews pass to the lightbox through `icons`. */
export const previewIcons = {
  close: hugeicon(Cancel01Icon as IconData),
  prev: arrow(arrowPaths.left[0]),
  next: arrow(arrowPaths.right[0]),
  zoom: hugeicon(ZoomInAreaIcon as IconData),
};
