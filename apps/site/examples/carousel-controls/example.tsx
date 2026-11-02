"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  carouselStyles,
  mountCarouselStyle,
} from "@/components/docs/carousel-styles";
import { createSegmentHighlights } from "@/components/segment-highlight";
import { photos } from "@/lib/photos";
import "@/components/docs/carousel-controls.css";
export function Example() {
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const name = useId();
  const group = useRef<HTMLFieldSetElement>(null);
  const demo = useRef<HTMLDivElement>(null);
  const style = carouselStyles[index];
  useEffect(() => {
    if (!group.current) return;
    setReady(true);
    return createSegmentHighlights(group.current);
  }, []);
  useEffect(() => {
    const node = demo.current;
    if (!node) return;
    return mountCarouselStyle(node, style.name);
  }, [style.name]);
  return (
    <section className="cc flex min-w-0 flex-col text-body">
      <fieldset
        ref={group}
        disabled={!ready}
        className="cc-seg flex max-w-full gap-0.5 overflow-x-auto rounded-full border-0 p-1"
      >
        <legend className="sr-only">Carousel control style</legend>
        {carouselStyles.map((entry, at) => (
          <label
            key={entry.name}
            className="cc-seg-item relative inline-flex shrink-0 items-center whitespace-nowrap"
            data-re-row
            data-current={at === index ? "" : undefined}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={at === index}
              onChange={(event) => {
                setIndex(at);
                event.currentTarget.parentElement?.scrollIntoView({
                  block: "nearest",
                  inline: "nearest",
                });
              }}
            />
            {entry.name}
          </label>
        ))}
      </fieldset>
      <div ref={demo} className="cc-demo">
        <div className="cc-c cc-c-dots">
          <div className="cc-view re-carousel">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="cc-slide re-carousel__slide"
                data-carousel-slide
              >
                {/* biome-ignore lint/performance/noImgElement: standalone recipe uses native images. */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={1600}
                  height={1200}
                  draggable={false}
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
      <p className="cc-note max-w-prose text-ui leading-6">
        <b>{style.name}.</b> {style.note}
      </p>
    </section>
  );
}
