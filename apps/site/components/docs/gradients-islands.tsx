"use client";

import { createCarousel } from "@reuse-sh/carousel";
import {
  createFadeEdge,
  easingGradient,
  FADE_CURVES,
  FADE_MODES,
  type FadeCurve,
  type FadeEdge,
  type FadeMode,
} from "@reuse-sh/gradients";
import { useEffect, useRef, useState } from "react";
import { photos } from "../../lib/photos";
import { createSegmentHighlights } from "../segment-highlight";

const label = (value: string) => value[0].toUpperCase() + value.slice(1);

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
  const group = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    if (!group.current) return;
    return createSegmentHighlights(group.current);
  }, []);
  return (
    <fieldset ref={group} className="cc-seg">
      <legend className="sr-only">{legend}</legend>
      {values.map((value) => (
        <label
          key={value}
          className="cc-seg-item"
          data-re-row
          data-current={value === selected ? "" : undefined}
        >
          <input
            type="radio"
            name={name}
            className="sr-only"
            checked={value === selected}
            onChange={() => onSelect(value)}
          />
          {label(value)}
        </label>
      ))}
    </fieldset>
  );
}

export function FadeEdgeStrip() {
  const strip = useRef<HTMLDivElement>(null);
  const fade = useRef<FadeEdge | null>(null);
  const [mode, setMode] = useState<FadeMode>("scroll");
  const [curve, setCurve] = useState<FadeCurve>("smooth");
  const initial = useRef({ mode, curve });

  useEffect(() => {
    if (!strip.current) return;
    const carousel = createCarousel(strip.current, { align: "start" });
    const created = createFadeEdge(strip.current, {
      size: 64,
      ...initial.current,
    });
    fade.current = created;
    return () => {
      created.destroy();
      fade.current = null;
      carousel.destroy();
    };
  }, []);

  useEffect(() => {
    fade.current?.update({ mode, curve });
  }, [mode, curve]);

  return (
    <div className="x-fade">
      <div className="x-fade-bar">
        <Choice
          name="x-fade-mode"
          legend="Fade mode"
          values={FADE_MODES}
          selected={mode}
          onSelect={setMode}
        />
        <Choice
          name="x-fade-curve"
          legend="Fade curve"
          values={FADE_CURVES}
          selected={curve}
          onSelect={setCurve}
        />
      </div>
      <section
        ref={strip}
        className="re-carousel x-fade-strip"
        aria-label="Prints in the series"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region needs focus so keyboard users can scroll it.
        tabIndex={0}
      >
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="re-carousel__slide x-fade-item"
            data-carousel-slide=""
          >
            {/* biome-ignore lint/performance/noImgElement: a static SVG texture inside a plain scroller. */}
            <img
              className="x-fade-img"
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              draggable={false}
            />
            <figcaption className="x-fade-caption">{photo.caption}</figcaption>
          </figure>
        ))}
      </section>
    </div>
  );
}

const SCRIM_CURVES = ["eased", "linear"] as const;
type ScrimCurve = (typeof SCRIM_CURVES)[number];

const scrims: Record<ScrimCurve, string> = {
  eased: easingGradient({ to: "rgb(0 0 0 / 0.72)", direction: "to bottom" }),
  linear: easingGradient({
    to: "rgb(0 0 0 / 0.72)",
    direction: "to bottom",
    easing: "linear",
  }),
};

export function ImageCaption() {
  const [curve, setCurve] = useState<ScrimCurve>("eased");
  const photo = photos[4];
  return (
    <div className="x-fade">
      <div className="x-fade-bar">
        <Choice
          name="x-scrim-curve"
          legend="Scrim curve"
          values={SCRIM_CURVES}
          selected={curve}
          onSelect={setCurve}
        />
      </div>
      <figure className="x-caption">
        {/* biome-ignore lint/performance/noImgElement: a static SVG texture under a caption. */}
        <img
          className="x-caption-img"
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
        />
        <figcaption
          className="x-caption-text"
          style={{ backgroundImage: scrims[curve] }}
        >
          <b>{photo.caption}</b>
          <span>Marble print on cotton paper, 50 × 70 cm, edition of 30</span>
        </figcaption>
      </figure>
    </div>
  );
}
