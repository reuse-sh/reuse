"use client";

import { type ComponentProps, useEffect, useRef } from "react";
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
  useEffect(() => {
    if (!ref.current) return;
    const controller = createThinkingDots(ref.current, { size, config });
    return () => controller.destroy();
  }, [size, config]);
  return (
    <span
      {...props}
      className={`reuse-thinking-dots ${className}`}
      role="status"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <canvas ref={ref} style={{ width: size, height: size }} />
    </span>
  );
}
