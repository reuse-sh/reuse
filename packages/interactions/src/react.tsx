"use client";

import {
  type ButtonHTMLAttributes,
  cloneElement,
  createContext,
  type HTMLAttributes,
  type ReactElement,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  createFloatingTooltip,
  createHoldToConfirm,
  createMovingHighlight,
  type FloatingTooltipOptions,
  type HoldToConfirmOptions,
  type MovingHighlightOptions,
} from "./index.js";

const TooltipGroup = createContext(false);

export interface FloatingTooltipGroupProps
  extends HTMLAttributes<HTMLDivElement>,
    FloatingTooltipOptions {}

export function FloatingTooltipGroup({
  children,
  selector,
  side,
  sideOffset,
  delay,
  closeDelay,
  viewportPadding,
  track,
  ...props
}: FloatingTooltipGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const trackX = track?.x;
  const trackY = track?.y;
  useEffect(() => {
    if (!ref.current) return;
    const controller = createFloatingTooltip(ref.current, {
      selector,
      side,
      sideOffset,
      delay,
      closeDelay,
      viewportPadding,
      track: { x: trackX, y: trackY },
    });
    return () => controller.destroy();
  }, [
    selector,
    side,
    sideOffset,
    delay,
    closeDelay,
    viewportPadding,
    trackX,
    trackY,
  ]);
  return (
    <TooltipGroup.Provider value={true}>
      <div {...props} ref={ref}>
        {children}
      </div>
    </TooltipGroup.Provider>
  );
}

export interface FloatingTooltipProps extends FloatingTooltipOptions {
  content: string;
  children: ReactElement<Record<string, unknown>>;
}

export function FloatingTooltip({
  content,
  children,
  selector,
  side,
  sideOffset,
  delay,
  closeDelay,
  viewportPadding,
  track,
}: FloatingTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const grouped = useContext(TooltipGroup);
  const trackX = track?.x;
  const trackY = track?.y;
  useEffect(() => {
    if (!ref.current || grouped) return;
    const controller = createFloatingTooltip(ref.current, {
      selector,
      side,
      sideOffset,
      delay,
      closeDelay,
      viewportPadding,
      track: { x: trackX, y: trackY },
    });
    return () => controller.destroy();
  }, [
    grouped,
    selector,
    side,
    sideOffset,
    delay,
    closeDelay,
    viewportPadding,
    trackX,
    trackY,
  ]);
  return (
    <span ref={ref} className="reuse-tooltip-trigger">
      {cloneElement(children, { "data-reuse-tooltip": content })}
    </span>
  );
}

export interface MovingHighlightProps
  extends HTMLAttributes<HTMLDivElement>,
    MovingHighlightOptions {}

export function MovingHighlight({
  children,
  rowSelector,
  selectedSelector,
  ...props
}: MovingHighlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const controller = createMovingHighlight(ref.current, {
      rowSelector,
      selectedSelector,
    });
    return () => controller.destroy();
  }, [rowSelector, selectedSelector]);
  return (
    <div {...props} ref={ref}>
      {children}
    </div>
  );
}

export interface HoldToConfirmButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    HoldToConfirmOptions {}

export function HoldToConfirmButton({
  onConfirm,
  holdMs = 1200,
  children,
  className,
  ...props
}: HoldToConfirmButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const callback = useRef(onConfirm);
  callback.current = onConfirm;
  useEffect(() => {
    if (!ref.current) return;
    const controller = createHoldToConfirm(ref.current, {
      holdMs,
      onConfirm: () => callback.current(),
    });
    return () => controller.destroy();
  }, [holdMs]);
  return (
    <button
      type="button"
      {...props}
      className={["reuse-hold", className].filter(Boolean).join(" ")}
      ref={ref}
    >
      {children}
    </button>
  );
}
