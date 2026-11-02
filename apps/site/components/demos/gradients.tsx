import { easingGradient } from "@reuse-sh/gradients";

const colors = [["Ink", "#111"]] as const;

export function GradientsDemo() {
  return (
    <div className="gradient-demo grid gap-[12px] p-[28px] rounded-[18px] [background:var(--surface)] shadow-[var(--shadow-raised)]">
      <div
        className="gradient-demo-head text-[13px] text-[color:var(--mute)]"
        aria-hidden="true"
      >
        <span />
        <span>Linear</span>
        <span>Eased</span>
      </div>
      {colors.map(([name, color]) => (
        <div key={name} className="gradient-demo-row">
          <span className="gradient-demo-name text-[13px] text-[color:var(--prose)]">
            {name}
          </span>
          {(["linear", "ease-in-out-sine"] as const).map((easing) => (
            <span
              key={easing}
              className="gradient-demo-swatch h-[72px] rounded-[10px]"
              role="img"
              aria-label={`${name}, ${easing === "linear" ? "linear" : "eased"} fade from transparent`}
              style={{
                backgroundImage: easingGradient({
                  to: color,
                  easing,
                  direction: "to right",
                }),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
