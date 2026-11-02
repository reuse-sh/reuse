"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef, useState } from "react";
import "@reuse-sh/interactions/styles.css";
import { easingGradient } from "@reuse-sh/gradients";

const curves = ["eased", "linear"] as const;
const scrims = {
  eased: easingGradient({ to: "rgb(0 0 0 / 0.6)" }),
  linear: easingGradient({ to: "rgb(0 0 0 / 0.6)", easing: "linear" }),
};
function Choice<T extends string>({
  name,
  legend,
  values,
  selected,
  onSelect,
}: {
  name: string;
  legend: string;
  values: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const root = useRef<HTMLFieldSetElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    setEnhanced(true);
    const selected = createMovingHighlight(root.current, {
      mode: "selected",
      className: "[background:rgb(0_0_0_/_0.055)]",
    });
    const hover = createMovingHighlight(root.current, {
      mode: "hover",
      selectedSelector: "[data-none]",
    });
    return () => {
      hover.destroy();
      selected.destroy();
    };
  }, []);
  return (
    <fieldset
      ref={root}
      className="relative m-0 inline-flex min-w-0 gap-0.5 rounded-xl border-0 bg-[#f3f3f3] p-1 [--re-highlight-radius:8px]"
    >
      <legend className="sr-only">{legend}</legend>
      {values.map((value) => (
        <label
          key={value}
          data-re-row=""
          data-current={value === selected ? "" : undefined}
          className="relative cursor-pointer rounded-lg px-3 py-1.5 text-[13px] capitalize text-[#1f1f1f] has-focus-visible:outline has-focus-visible:outline-2"
        >
          <input
            className="sr-only"
            disabled={!enhanced}
            type="radio"
            name={name}
            checked={value === selected}
            onChange={() => onSelect(value)}
          />
          {value}
        </label>
      ))}
    </fieldset>
  );
}
export function Example() {
  const [curve, setCurve] = useState<(typeof curves)[number]>("eased");
  return (
    <div>
      <div className="mb-[18px] flex flex-wrap gap-2.5">
        <Choice
          name="scrim-curve"
          legend="Scrim curve"
          values={curves}
          selected={curve}
          onSelect={setCurve}
        />
      </div>
      <figure className="relative m-0 overflow-hidden rounded-[14px]">
        {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses a native image. */}
        <img
          className="block aspect-[3/2] h-auto w-full object-cover"
          src="https://reuse.sh/images/marble-forest.svg"
          alt="A soft marble texture in sand, green and violet"
          width={1600}
          height={1200}
        />
        <figcaption
          className="absolute inset-x-0 bottom-0 grid gap-0.5 px-6 pt-[120px] pb-[22px] text-[13.5px] leading-5 text-white max-sm:px-4 max-sm:pt-16"
          style={{ backgroundImage: scrims[curve] }}
        >
          <b className="text-[17px] leading-6 font-semibold">Sand and fern</b>
          <span>Marble print on cotton paper, 50 × 70 cm, edition of 30</span>
        </figcaption>
      </figure>
    </div>
  );
}
