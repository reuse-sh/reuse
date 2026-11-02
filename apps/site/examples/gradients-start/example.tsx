import { easingGradient } from "@reuse-sh/gradients";
export function Example() {
  return (
    <div className="grid gap-3 text-xs text-[#858585]">
      <div className="grid grid-cols-[40px_1fr_1fr] gap-3" aria-hidden="true">
        <span />
        <span>Linear</span>
        <span>Eased</span>
      </div>
      <div className="grid grid-cols-[40px_1fr_1fr] items-center gap-3">
        <span>Ink</span>
        {(["linear", "ease-in-out-sine"] as const).map((easing) => (
          <span
            key={easing}
            className="h-16 rounded-lg"
            role="img"
            aria-label={`Ink, ${easing === "linear" ? "linear" : "eased"} fade from transparent`}
            style={{
              backgroundImage: easingGradient({
                to: "#111",
                easing,
                direction: "to right",
              }),
            }}
          />
        ))}
      </div>
    </div>
  );
}
