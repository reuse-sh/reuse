"use client";

import {
  createFadeEdge,
  FADE_CURVES,
  FADE_MODES,
  type FadeCurve,
  type FadeEdge,
  type FadeMode,
} from "@reuse-sh/shadows";
import { useEffect, useRef, useState } from "react";
import { photos } from "../../lib/photos";
import { Tabs } from "../shell/tabs";

const label = (value: string) => value[0].toUpperCase() + value.slice(1);

export function FadeEdgeStrip() {
  const strip = useRef<HTMLDivElement>(null);
  const fade = useRef<FadeEdge | null>(null);
  const [mode, setMode] = useState<FadeMode>("scroll");
  const [curve, setCurve] = useState<FadeCurve>("smooth");
  const initial = useRef({ mode, curve });

  useEffect(() => {
    if (!strip.current) return;
    const created = createFadeEdge(strip.current, {
      size: 64,
      ...initial.current,
    });
    fade.current = created;
    return () => {
      created.destroy();
      fade.current = null;
    };
  }, []);

  useEffect(() => {
    fade.current?.update({ mode, curve });
  }, [mode, curve]);

  return (
    <div className="x-fade">
      <div className="x-fade-bar">
        <Tabs
          idBase="x-fade-mode"
          label="Fade mode"
          items={FADE_MODES.map((id) => ({ id, label: label(id) }))}
          selected={mode}
          onSelect={(id) => setMode(id as FadeMode)}
        />
        <Tabs
          idBase="x-fade-curve"
          label="Fade curve"
          items={FADE_CURVES.map((id) => ({ id, label: label(id) }))}
          selected={curve}
          onSelect={(id) => setCurve(id as FadeCurve)}
        />
      </div>
      <section
        ref={strip}
        className="x-fade-strip"
        aria-label="Prints in the series"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrolling region needs focus so keyboard users can scroll it.
        tabIndex={0}
      >
        {photos.map((photo) => (
          <figure key={photo.id} className="x-fade-item">
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
