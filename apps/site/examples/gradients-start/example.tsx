import { easingGradient } from "@reuse-sh/gradients";
export function Example() {
  return (
    <div className="grid gap-3 rounded-[18px] bg-white p-7 shadow-[0_0_0_0.5px_#00000014,0_1px_2px_#0000000d,0_4px_8px_#00000009] max-[600px]:px-4 max-[600px]:py-[18px]">
      <div
        className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 text-[13px] text-[#858585] max-[600px]:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] max-[600px]:gap-2"
        aria-hidden="true"
      >
        <span />
        <span>Linear</span>
        <span>Eased</span>
      </div>
      <div className="grid grid-cols-[56px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 max-[600px]:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)] max-[600px]:gap-2">
        <span className="text-[13px] text-[#5b5b5b]">Ink</span>
        {(["linear", "ease-in-out-sine"] as const).map((easing) => (
          <span
            key={easing}
            className="h-[72px] rounded-[10px]"
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
