"use client";

import {
  type ButtonHTMLAttributes,
  cloneElement,
  createContext,
  type HTMLAttributes,
  type ReactElement,
  type RefObject,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  type CopyButtonOptions,
  createCopyButton,
  createFloatingTooltip,
  createHoldToConfirm,
  createMovingHighlight,
  type FloatingTooltipOptions,
  type HoldToConfirmOptions,
  type MovingHighlightOptions,
} from "./index.js";

const TooltipGroup = createContext(false);

interface TooltipSettings extends Omit<FloatingTooltipOptions, "className"> {
  tooltipClassName?: string;
}

function useFloatingTooltip(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
  { tooltipClassName, content, ...options }: TooltipSettings,
) {
  const controller = useRef<ReturnType<typeof createFloatingTooltip> | null>(
    null,
  );
  const contentRef = useRef(content);
  contentRef.current = content;
  const settings: FloatingTooltipOptions = {
    ...options,
    className: tooltipClassName,
    content: content && ((trigger) => contentRef.current?.(trigger) ?? null),
  };
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const created = createFloatingTooltip(ref.current, settingsRef.current);
    controller.current = created;
    return () => {
      created.destroy();
      controller.current = null;
    };
  }, [enabled, ref]);
  useEffect(() => {
    controller.current?.update(settingsRef.current);
  });
}

export interface FloatingTooltipGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "content">,
    TooltipSettings {}

export function FloatingTooltipGroup({
  children,
  selector,
  side,
  sideOffset,
  delay,
  closeDelay,
  viewportPadding,
  track,
  tilt,
  tooltipClassName,
  content,
  ...props
}: FloatingTooltipGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  useFloatingTooltip(ref, true, {
    selector,
    side,
    sideOffset,
    delay,
    closeDelay,
    viewportPadding,
    track,
    tilt,
    tooltipClassName,
    content,
  });
  return (
    <TooltipGroup.Provider value={true}>
      <div {...props} ref={ref}>
        {children}
      </div>
    </TooltipGroup.Provider>
  );
}

export interface FloatingTooltipProps extends Omit<TooltipSettings, "content"> {
  content: string;
  children: ReactElement<Record<string, unknown>>;
}

export function FloatingTooltip({
  content,
  children,
  ...settings
}: FloatingTooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const grouped = useContext(TooltipGroup);
  useFloatingTooltip(ref, !grouped, settings);
  return (
    <span ref={ref} className="re-tooltip-trigger">
      {cloneElement(children, { "data-re-tooltip": content })}
    </span>
  );
}

export interface MovingHighlightProps
  extends HTMLAttributes<HTMLDivElement>,
    Omit<MovingHighlightOptions, "className"> {
  highlightClassName?: string;
}

export function MovingHighlight({
  children,
  rowSelector,
  selectedSelector,
  mode,
  highlightClassName,
  ...props
}: MovingHighlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const controller = createMovingHighlight(ref.current, {
      rowSelector,
      selectedSelector,
      mode,
      className: highlightClassName,
    });
    return () => controller.destroy();
  }, [rowSelector, selectedSelector, mode, highlightClassName]);
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
      className={["re-hold", className].filter(Boolean).join(" ")}
      ref={ref}
    >
      {children}
    </button>
  );
}

export type CopyButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onCopy" | "onError"
> &
  CopyButtonOptions;

export function CopyButton({
  text,
  getText,
  resetMs = 1600,
  onCopy,
  onError,
  children,
  className,
  ...props
}: CopyButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const latest = useRef({ text, getText, onCopy, onError });
  latest.current = { text, getText, onCopy, onError };
  useEffect(() => {
    if (!ref.current) return;
    const controller = createCopyButton(ref.current, {
      resetMs,
      getText: () => {
        const { text, getText } = latest.current;
        return getText ? getText() : (text ?? "");
      },
      onCopy: (value) => latest.current.onCopy?.(value),
      onError: (error) => latest.current.onError?.(error),
    });
    return () => controller.destroy();
  }, [resetMs]);
  return (
    <button
      type="button"
      {...props}
      className={["re-copy-button", className].filter(Boolean).join(" ")}
      ref={ref}
    >
      {/* A string child is updated through textContent, which would drop the icon. */}
      {children == null ? null : <span>{children}</span>}
    </button>
  );
}
