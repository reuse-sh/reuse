"use client";
import { useEffect, useId, useRef, useState } from "react";
import { carouselStyles, mountCarouselStyle } from "./carousel-styles";
import { photos } from "./photos";
import { createSegmentHighlights } from "./segment-highlight";
import "./styles.css";
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
    <section className="re-cc flex min-w-0 flex-col text-[15px] leading-6">
      <fieldset
        ref={group}
        disabled={!ready}
        className="re-cc-seg flex max-w-full gap-0.5 overflow-x-auto rounded-full border-0 p-[3px]"
      >
        <legend className="re-cc-sr-only">Carousel control style</legend>
        {carouselStyles.map((entry, at) => (
          <label
            key={entry.name}
            className="re-cc-seg-item relative inline-flex shrink-0 items-center whitespace-nowrap"
            data-re-row
            data-current={at === index ? "" : undefined}
          >
            <input
              type="radio"
              name={name}
              className="re-cc-sr-only"
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
      <div ref={demo} className="re-cc-demo">
        <div className="re-cc-c re-cc-c-dots">
          <div className="re-cc-view re-carousel">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="re-cc-slide re-carousel__slide"
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
      <p className="re-cc-note max-w-[60ch] text-sm leading-[22px]">
        <b>{style.name}.</b> {style.note}
      </p>
    </section>
  );
}
