"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const curves = ["eased", "linear"] as const;
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
      className: "bg-card shadow-control",
    });
    const hover = createMovingHighlight(root.current, {
      mode: "hover",
      selectedSelector: "[data-none]",
      className: "bg-accent",
    });
    return () => {
      hover.destroy();
      selected.destroy();
    };
  }, []);
  return (
    <fieldset
      ref={root}
      className="relative m-0 flex w-fit min-w-0 max-w-full gap-0.5 overflow-x-auto rounded-full border-0 bg-accent p-1 [&_.re-moving-highlight]:rounded-full [&::-webkit-scrollbar]:hidden"
    >
      <legend className="sr-only">{legend}</legend>
      {values.map((value) => (
        <label
          key={value}
          data-re-row=""
          data-current={value === selected ? "" : undefined}
          className="relative inline-flex h-7.5 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full border-0 bg-transparent px-3 text-label font-medium capitalize text-muted-foreground transition-colors duration-150 hover:text-foreground has-checked:text-foreground has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-foreground"
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
      <div className="mb-4.5 flex flex-wrap gap-2.5">
        <Choice
          name="scrim-curve"
          legend="Scrim curve"
          values={curves}
          selected={curve}
          onSelect={setCurve}
        />
      </div>
      <figure className="relative m-0 overflow-hidden rounded-xl shadow-raised">
        {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses a native image. */}
        <img
          className="block aspect-landscape h-auto w-full object-cover"
          src="https://reuse.sh/images/marble-forest.svg"
          alt="A soft marble texture in sand, green and violet"
          width={1600}
          height={1200}
        />
        <figcaption
          className={cn(
            "re-gradient re-gradient-to-scrim/60 absolute inset-x-0 bottom-0 grid gap-0.5 px-6 pt-30 pb-5.5 text-ui leading-5 text-overlay-foreground max-sm:px-4 max-sm:pt-18 max-sm:pb-3.5",
            curve === "linear"
              ? "re-gradient-linear"
              : "re-gradient-ease-in-out-sine",
          )}
        >
          <b className="text-subsection leading-6 font-semibold text-inherit">
            Sand and fern
          </b>
          <span>Marble print on cotton paper, 50 × 70 cm, edition of 30</span>
        </figcaption>
      </figure>
    </div>
  );
}
