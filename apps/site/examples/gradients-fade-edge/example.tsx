"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef, useState } from "react";
import "@reuse-sh/interactions/styles.css";
import { createCarousel } from "@reuse-sh/carousel";
import "@reuse-sh/carousel/styles.css";
import {
  createFadeEdge,
  FADE_CURVES,
  FADE_MODES,
  type FadeCurve,
  type FadeEdge,
  type FadeMode,
} from "@reuse-sh/gradients";

const photos = [
  {
    id: "lake",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    src: "https://reuse.sh/images/marble-lake.svg",
  },
  {
    id: "mountains",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    src: "https://reuse.sh/images/marble-mountains.svg",
  },
  {
    id: "coast",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    src: "https://reuse.sh/images/marble-coast.svg",
  },
  {
    id: "forest",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    src: "https://reuse.sh/images/marble-forest.svg",
  },
  {
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
  },
  {
    id: "woods",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    src: "https://reuse.sh/images/marble-woods.svg",
  },
  {
    id: "dune",
    caption: "Sea glass",
    alt: "A soft marble texture in sea green, blue and pink",
    src: "https://reuse.sh/images/marble-dune.svg",
  },
  {
    id: "meadow",
    caption: "Dusk",
    alt: "A soft marble texture in periwinkle, peach and green",
    src: "https://reuse.sh/images/marble-meadow.svg",
  },
];
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
  const strip = useRef<HTMLElement>(null);
  const fade = useRef<FadeEdge | null>(null);
  const [mode, setMode] = useState<FadeMode>("scroll");
  const [curve, setCurve] = useState<FadeCurve>("smooth");
  useEffect(() => {
    if (!strip.current) return;
    const carousel = createCarousel(strip.current, { align: "start" });
    const controller = createFadeEdge(strip.current, { size: 64 });
    fade.current = controller;
    return () => {
      controller.destroy();
      fade.current = null;
      carousel.destroy();
    };
  }, []);
  useEffect(() => {
    fade.current?.update({ mode, curve });
  }, [mode, curve]);
  return (
    <div>
      <div className="mb-[18px] flex flex-wrap gap-2.5">
        <Choice
          name="fade-mode"
          legend="Fade mode"
          values={FADE_MODES}
          selected={mode}
          onSelect={setMode}
        />
        <Choice
          name="fade-curve"
          legend="Fade curve"
          values={FADE_CURVES}
          selected={curve}
          onSelect={setCurve}
        />
      </div>
      <section
        ref={strip}
        className="re-carousel [--re-carousel-gap:12px] [--re-carousel-slide-width:240px] max-[600px]:[--re-carousel-slide-width:200px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111]"
        aria-label="Prints in the series"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrolling region must support keyboard scrolling.
        tabIndex={0}
      >
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="re-carousel__slide m-0"
            data-carousel-slide=""
          >
            {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images. */}
            <img
              className="block aspect-[4/3] h-auto w-full rounded-lg object-cover"
              src={photo.src}
              alt={photo.alt}
              width={1600}
              height={1200}
              draggable={false}
            />
            <figcaption className="mt-2 text-[13px] text-[#858585]">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
