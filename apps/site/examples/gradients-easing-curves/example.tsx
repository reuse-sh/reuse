import {
  EASINGS,
  type EasingName,
  easingGradient,
  easingStops,
} from "@reuse-sh/gradients";

const notes: Record<EasingName, string> = {
  "ease-in-out-sine":
    "Quiet at both ends and quickest in the middle. The default, and the right one for most fades.",
  "ease-in":
    "Stays light for longest and darkens near the end. Good for a scrim that should leave most of the image alone.",
  "ease-out":
    "Darkens early and settles. Good when the solid end should reach further into the gradient.",
  linear:
    "One straight ramp with two stops. Its start and end show as lines on a large surface.",
};
export function Example() {
  return (
    <ul className="m-0 grid list-none gap-7 p-0">
      {EASINGS.map((easing) => (
        <li
          key={easing}
          className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-x-5 gap-y-2.5"
        >
          <svg
            className="row-span-2 size-16 overflow-visible rounded-[10px] bg-white shadow-[0_0_0_0.5px_#00000014]"
            viewBox="-4 -4 108 108"
            aria-hidden="true"
            focusable="false"
          >
            <polyline
              className="fill-none stroke-[#111] stroke-[3] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]"
              points={easingStops(easing, 24)
                .map(
                  ({ position, progress }) =>
                    `${position * 100},${100 - progress * 100}`,
                )
                .join(" ")}
            />
          </svg>
          <span
            className="h-9 rounded-lg shadow-[0_0_0_0.5px_#00000014]"
            style={{
              backgroundImage: easingGradient({
                to: "#111",
                easing,
                direction: "to right",
              }),
            }}
          />
          <p className="m-0 text-sm leading-[22px] text-[#5b5b5b]">
            <code>{easing}</code> {notes[easing]}
          </p>
        </li>
      ))}
    </ul>
  );
}
