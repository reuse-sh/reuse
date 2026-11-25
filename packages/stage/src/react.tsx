"use client";

import { type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { createStage, type StageOptions } from "./index.js";

export type { StageAct, StagePoint, StageTarget } from "./index.js";

export interface StageProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">,
    StageOptions {
  children: ReactNode;
}

export function Stage({
  width,
  height,
  label,
  script,
  reset,
  still,
  rest,
  interactive,
  additionalCursors,
  enabled,
  delay,
  className,
  children,
  ...props
}: StageProps) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef({ script, reset, still });
  latest.current = { script, reset, still };
  const restX = rest?.x;
  const restY = rest?.y;
  const cursorPositions = JSON.stringify(additionalCursors ?? []);
  useEffect(() => {
    if (!root.current) return;
    const stage = createStage(root.current, {
      width,
      height,
      label,
      interactive,
      enabled,
      additionalCursors: JSON.parse(cursorPositions) as NonNullable<
        StageOptions["additionalCursors"]
      >,
      delay,
      rest:
        restX === undefined || restY === undefined
          ? undefined
          : { x: restX, y: restY },
      script: (act, others) => latest.current.script(act, others),
      reset: () => latest.current.reset?.(),
      still: () => (latest.current.still ?? latest.current.reset)?.(),
    });
    return () => stage.destroy();
  }, [
    width,
    height,
    label,
    interactive,
    enabled,
    cursorPositions,
    delay,
    restX,
    restY,
  ]);
  return (
    <div
      {...props}
      ref={root}
      className={className ? `re-stage ${className}` : "re-stage"}
    >
      <div className="re-stage-scene">{children}</div>
    </div>
  );
}
