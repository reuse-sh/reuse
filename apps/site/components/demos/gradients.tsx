import { easingGradient } from "@reuse-sh/gradients";

const colors = [["Ink", "#111"]] as const;

export function GradientsDemo() {
  return (
    <div className="gradient-demo">
      <div className="gradient-demo-head" aria-hidden="true">
        <span />
        <span>Linear</span>
        <span>Eased</span>
      </div>
      {colors.map(([name, color]) => (
        <div key={name} className="gradient-demo-row">
          <span className="gradient-demo-name">{name}</span>
          {(["linear", "ease-in-out-sine"] as const).map((easing) => (
            <span
              key={easing}
              className="gradient-demo-swatch"
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
