"use client";
import { createCarousel } from "@reuse-sh/carousel";
import {
  createFadeEdge,
  FADE_CURVES,
  FADE_MODES,
  type FadeCurve,
  type FadeEdge,
  type FadeMode,
} from "@reuse-sh/gradients";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef, useState } from "react";

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
      <div className="mb-4.5 flex flex-wrap gap-2.5">
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
        className="re-carousel gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        aria-label="Prints in the series"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the scrolling region must support keyboard scrolling.
        tabIndex={0}
      >
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="re-carousel__slide m-0 basis-60 max-sm:basis-50"
            data-carousel-slide=""
          >
            {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images. */}
            <img
              className="block aspect-4/3 h-auto w-full rounded-lg object-cover"
              src={photo.src}
              alt={photo.alt}
              width={1600}
              height={1200}
              draggable={false}
            />
            <figcaption className="mt-2 text-label text-subtle-foreground">
              {photo.caption}
            </figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}
