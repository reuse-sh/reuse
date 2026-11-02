import { EASINGS, type EasingName, easingStops } from "@reuse-sh/gradients";
import { InlineCode } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

const gradientClasses: Record<EasingName, string> = {
  "ease-in-out-sine": "re-gradient-ease-in-out-sine",
  "ease-in": "re-gradient-ease-in",
  "ease-out": "re-gradient-ease-out",
  linear: "re-gradient-linear",
};

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
        <li key={easing} className="flex items-center gap-5">
          <svg
            className="size-16 shrink-0 overflow-visible rounded-control bg-card shadow-ring"
            viewBox="-4 -4 108 108"
            aria-hidden="true"
            focusable="false"
          >
            <polyline
              className="fill-none stroke-foreground"
              strokeWidth={3}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={easingStops(easing, 24)
                .map(
                  ({ position, progress }) =>
                    `${position * 100},${100 - progress * 100}`,
                )
                .join(" ")}
            />
          </svg>
          <div className="min-w-0 flex-1 space-y-2.5">
            <span
              className={cn(
                "re-gradient re-gradient-dir-r re-gradient-to-foreground block h-9 rounded-lg shadow-ring",
                gradientClasses[easing],
              )}
            />
            <p className="m-0 text-sm leading-5.5 text-pretty text-muted-foreground">
              <InlineCode>{easing}</InlineCode> {notes[easing]}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
