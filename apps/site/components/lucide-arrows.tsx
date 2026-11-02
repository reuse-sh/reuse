export const arrowPaths = {
  down: ["m6 9 6 6 6-6"],
  left: ["m15 18-6-6 6-6"],
  right: ["m9 18 6-6-6-6"],
  "arrow-left": ["m12 19-7-7 7-7", "M19 12H5"],
  "arrow-right": ["M5 12h14", "m12 5 7 7-7 7"],
  arrow: ["M7 7h10v10", "M7 17 17 7"],
} as const;

export type ArrowName = keyof typeof arrowPaths;

export function ArrowIcon({
  name,
  size = 18,
  className,
}: {
  name: ArrowName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {arrowPaths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export function nativeArrow(name: ArrowName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [attribute, value] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
  }))
    svg.setAttribute(attribute, value);
  for (const path of arrowPaths[name]) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    element.setAttribute("d", path);
    svg.append(element);
  }
  return svg;
}
