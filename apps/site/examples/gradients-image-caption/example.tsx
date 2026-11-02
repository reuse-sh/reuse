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
      className:
        "[background:white] [box-shadow:0_0_0_0.5px_#00000014,0_1px_2px_#0000000d,0_2px_4px_#00000005]",
    });
    const hover = createMovingHighlight(root.current, {
      mode: "hover",
      selectedSelector: "[data-none]",
      className: "[background:rgb(0_0_0_/_0.03)]",
    });
    return () => {
      hover.destroy();
      selected.destroy();
    };
  }, []);
  return (
    <fieldset
      ref={root}
      className="relative m-0 flex w-fit min-w-0 max-w-full gap-0.5 overflow-x-auto rounded-full border-0 bg-black/[0.045] p-[3px] [--re-highlight-radius:999px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <legend className="sr-only">{legend}</legend>
      {values.map((value) => (
        <label
          key={value}
          data-re-row=""
          data-current={value === selected ? "" : undefined}
          className="relative inline-flex h-[30px] shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border-0 bg-transparent px-[13px] text-[13px] font-medium capitalize text-[#707070] transition-colors duration-150 hover:text-[#1f1f1f] has-checked:text-[#1f1f1f] has-focus-visible:outline-2 has-focus-visible:outline-offset-[-2px] has-focus-visible:outline-[#1f1f1f]"
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
      <figure className="relative m-0 overflow-hidden rounded-[14px] shadow-[0_0_0_0.5px_#00000014,0_1px_2px_#0000000d,0_4px_8px_#00000009]">
        {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses a native image. */}
        <img
          className="block aspect-[3/2] h-auto w-full object-cover"
          src="https://reuse.sh/images/marble-forest.svg"
          alt="A soft marble texture in sand, green and violet"
          width={1600}
          height={1200}
        />
        <figcaption
          className="absolute inset-x-0 bottom-0 grid gap-0.5 px-6 pt-[120px] pb-[22px] text-[13.5px] leading-5 text-white max-[600px]:px-4 max-[600px]:pt-[72px] max-[600px]:pb-3.5"
          style={{ backgroundImage: scrims[curve] }}
        >
          <b className="text-[17px] leading-6 font-semibold text-inherit">
            Sand and fern
          </b>
          <span>Marble print on cotton paper, 50 × 70 cm, edition of 30</span>
        </figcaption>
      </figure>
    </div>
  );
}
