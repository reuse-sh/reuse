"use client";

import { useEffect, useRef } from "react";

export function NativeFrame({
  id,
  unframed = false,
}: {
  id: string;
  unframed?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current;
    const container = element?.parentElement;
    if (!element || !container) return;
    let observer: ResizeObserver | undefined;
    const measure = () => {
      const body = element.contentDocument?.body;
      if (!body) return;
      body.style.width = `${container.clientWidth}px`;
      element.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`;
    };
    const loaded = () => {
      observer?.disconnect();
      const body = element.contentDocument?.body;
      if (!body) return;
      observer = new ResizeObserver(measure);
      observer.observe(body);
      observer.observe(container);
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
    <div className="w-full min-w-0 overflow-hidden">
      <iframe
        ref={frame}
        title="HTML and JavaScript example"
        src={`/examples/${id}/index.html?embed=${unframed ? "plain" : "card"}`}
        className="block h-80 w-screen border-0"
      />
    </div>
  );
}
