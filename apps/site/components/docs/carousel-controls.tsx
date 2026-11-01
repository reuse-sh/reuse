"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import { useEffect, useRef, useState } from "react";
import { carouselStyles, mountCarouselStyle } from "./carousel-styles";

export function CarouselControls() {
  const [index, setIndex] = useState(0);
  const group = useRef<HTMLFieldSetElement>(null);
  const demo = useRef<HTMLDivElement>(null);
  const style = carouselStyles[index];

  useEffect(() => {
    if (!group.current) return;
    const highlight = createMovingHighlight(group.current);
    return () => highlight.destroy();
  }, []);

  useEffect(() => {
    const node = demo.current;
    if (!node) return;
    const cleanup = mountCarouselStyle(node, style.name);
    return () => {
      cleanup();
      node.replaceChildren();
    };
  }, [style.name]);

  return (
    <div className="cc">
      <fieldset ref={group} className="cc-seg">
        <legend className="sr-only">Carousel control style</legend>
        {carouselStyles.map((entry, at) => (
          <label
            key={entry.name}
            className="cc-seg-item"
            data-reuse-row
            data-current={at === index ? "" : undefined}
          >
            <input
              type="radio"
              name="cc-style"
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
      <div ref={demo} className="cc-demo" />
      <p className="cc-note">
        <b>{style.name}.</b> {style.note}
      </p>
    </div>
  );
}
