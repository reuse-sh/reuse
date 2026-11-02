"use client";

import {
  type CarouselOptions,
  type CarouselState,
  createCarousel,
} from "@reuse-sh/carousel";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";
import { Icon } from "../icons";

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Binds createCarousel to the [data-viewport] inside and drives the optional
 * [data-dots], [data-prev], [data-next] and [data-counter] parts from its state.
 */
export function CarouselMount({
  options,
  className,
  children,
}: {
  options?: CarouselOptions;
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const optionsRef = useRef(options);
  useEffect(() => {
    const node = root.current;
    const viewport = node?.querySelector<HTMLElement>("[data-viewport]");
    if (!node || !viewport) return;
    const carousel = createCarousel(viewport, {
      loop: true,
      align: "start",
      ...optionsRef.current,
    });
    const dots = node.querySelector<HTMLElement>("[data-dots]");
    const prev = node.querySelector<HTMLButtonElement>("[data-prev]");
    const next = node.querySelector<HTMLButtonElement>("[data-next]");
    const counter = node.querySelector<HTMLElement>("[data-counter]");
    const onPrev = () => carousel.prev();
    const onNext = () => carousel.next();
    const onDot = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLElement>("button[data-index]");
      if (button) carousel.goTo(Number(button.dataset.index));
    };
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    dots?.addEventListener("click", onDot);
    const render = (state: CarouselState) => {
      if (dots) {
        dots.style.setProperty("--d-dot", String(state.index));
        for (const button of dots.querySelectorAll<HTMLElement>("[data-index]"))
          if (Number(button.dataset.index) === state.index)
            button.setAttribute("aria-current", "true");
          else button.removeAttribute("aria-current");
      }
      if (counter)
        counter.textContent = `${pad(state.index + 1)} / ${pad(state.count)}`;
      if (prev) prev.disabled = !state.canPrev;
      if (next) next.disabled = !state.canNext;
    };
    const unsubscribe = carousel.subscribe(render);
    render(carousel.getState());
    return () => {
      unsubscribe();
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      dots?.removeEventListener("click", onDot);
      carousel.destroy();
    };
  }, []);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

export function Dots({ labels }: { labels: readonly string[] }) {
  return (
    <div className="d-dots" data-dots style={{ "--d-dot": 0 } as CSSProperties}>
      {labels.map((label, index) => (
        <button
          key={label}
          type="button"
          data-index={index}
          aria-label={`Show ${label}`}
          aria-current={index === 0 ? "true" : undefined}
        />
      ))}
    </div>
  );
}

export function Arrows({
  ring = false,
  label = "slide",
}: {
  ring?: boolean;
  label?: string;
}) {
  return (
    <span className={ring ? "d-arrows d-arrows-ring" : "d-arrows"}>
      <button type="button" data-prev aria-label={`Previous ${label}`}>
        <Icon name="arrow-left" size={16} />
      </button>
      <button type="button" data-next aria-label={`Next ${label}`}>
        <Icon name="arrow-right" size={16} />
      </button>
    </span>
  );
}
