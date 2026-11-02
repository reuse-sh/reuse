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
        className="re-carousel [--re-carousel-gap:12px] [--re-carousel-slide-width:240px] max-sm:[--re-carousel-slide-width:180px]"
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
