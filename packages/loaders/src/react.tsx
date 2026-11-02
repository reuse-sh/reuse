"use client";

import { type ComponentProps, useEffect, useRef, useState } from "react";
import {
  createThinkingDots,
  THINKING_DOTS,
  type ThinkingDotsConfig,
} from "./index.js";

export interface ThinkingDotsProps extends ComponentProps<"span"> {
  size?: number;
  config?: ThinkingDotsConfig;
  label?: string;
}

export function ThinkingDots({
  size = 24,
  config = THINKING_DOTS,
  label,
  className = "",
  ...props
}: ThinkingDotsProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const controller = createThinkingDots(ref.current, { size, config });
    setReady(true);
    return () => {
      controller.destroy();
      setReady(false);
    };
  }, [size, config]);
  return (
    <span
      {...props}
      className={`re-thinking-dots ${className}`}
      role="status"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span
        className="re-thinking-dots__fallback"
        aria-hidden="true"
        hidden={ready}
        style={{ width: size, height: size }}
      >
        <span />
        <span />
        <span />
      </span>
      <canvas ref={ref} hidden={!ready} style={{ width: size, height: size }} />
    </span>
  );
}
