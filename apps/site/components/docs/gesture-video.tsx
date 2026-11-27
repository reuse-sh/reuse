"use client";

import { useEffect, useRef, useState } from "react";

export function GestureVideo({
  src,
  poster,
  width,
  height,
  label,
}: {
  src: string;
  poster: string;
  width: number;
  height: number;
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [autoplay, setAutoplay] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAutoplay(!motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element || !autoplay || paused) return;
    element.muted = true;
    let onScreen = false;
    const sync = () => {
      if (onScreen && document.visibilityState === "visible")
        element.play().catch(() => {});
      else element.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      element.pause();
    };
  }, [autoplay, paused]);

  return (
    <div className="relative">
      <video
        ref={video}
        src={src}
        poster={poster}
        width={width}
        height={height}
        muted
        loop
        playsInline
        preload="none"
        controls={!autoplay}
        aria-label={`${label} clip`}
        className="block h-auto w-full"
      />
      {autoplay ? (
        <button
          type="button"
          aria-label={`${paused ? "Play" : "Pause"} the ${label.toLowerCase()} clip`}
          onClick={() => setPaused((value) => !value)}
          className="absolute inset-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        />
      ) : null}
    </div>
  );
}
