"use client";

import { useEffect, useRef } from "react";

export function NativeFrame({ id }: { id: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const body = element.contentDocument?.body;
      if (!body) return;
      const style = getComputedStyle(body);
      element.style.height = `${Math.ceil(body.getBoundingClientRect().height + Number.parseFloat(style.marginTop) + Number.parseFloat(style.marginBottom))}px`;
    };
    const loaded = () => {
      observer?.disconnect();
      const body = element.contentDocument?.body;
      if (!body) return;
      observer = new ResizeObserver(measure);
      observer.observe(body);
      measure();
    };
    element.addEventListener("load", loaded);
    if (element.contentDocument?.readyState === "complete") loaded();
    return () => {
      observer?.disconnect();
      element.removeEventListener("load", loaded);
    };
  }, []);
  return (
    <iframe
      ref={frame}
      title="HTML and JavaScript example"
      src={`/examples/${id}/index.html`}
      className="block h-80 w-full border-0"
    />
  );
}
