"use client";

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import {
  type AvatarCorner,
  type AvatarGroupOptions,
  createAvatarGroup,
  enhanceAvatar,
  getInitials,
} from "./index.js";

export type AvatarBadge =
  | { type: "dot"; label: string; corner?: AvatarCorner }
  | { type: "count"; count: number; label: string; corner?: AvatarCorner }
  | { type: "icon"; icon: ReactNode; label: string; corner?: AvatarCorner };
export interface AvatarProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  name: string;
  src?: string;
  size?: number;
  badge?: AvatarBadge;
}

export function Avatar({
  name,
  src,
  size = 40,
  badge,
  className,
  style,
  ...props
}: AvatarProps) {
  if (!Number.isFinite(size) || size <= 0)
    throw new RangeError("Avatar size must be positive.");
  if (
    badge?.type === "count" &&
    (!Number.isSafeInteger(badge.count) || badge.count < 0)
  )
    throw new RangeError("Badge count must be a nonnegative safe integer.");
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const controller = enhanceAvatar(ref.current);
    return () => controller.destroy();
  });
  return (
    <span
      {...props}
      ref={ref}
      className={["re-avatar", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={[name || "Unknown person", badge?.label]
        .filter(Boolean)
        .join(", ")}
      data-re-avatar=""
      style={{ ...style, "--re-avatar-size": `${size}px` } as CSSProperties}
    >
      <span
        className="re-avatar-face"
        data-re-avatar-face=""
        aria-hidden="true"
      >
        {getInitials(name)}
        {src && (
          <img
            key={src}
            className="re-avatar-image"
            src={src}
            alt=""
            decoding="async"
          />
        )}
      </span>
      {badge && (
        <span
          className="re-avatar-badge"
          data-re-avatar-badge={badge.type}
          data-corner={badge.corner ?? "bottom-right"}
          aria-hidden="true"
        >
          {badge.type === "count"
            ? badge.count
            : badge.type === "icon"
              ? badge.icon
              : null}
        </span>
      )}
    </span>
  );
}

export interface AvatarGroupProps
  extends HTMLAttributes<HTMLSpanElement>,
    AvatarGroupOptions {}
export function AvatarGroup({
  children,
  overlap = 12,
  clearance = 2,
  className,
  ...props
}: AvatarGroupProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const controller = createAvatarGroup(ref.current, { overlap, clearance });
    return () => controller.destroy();
  }, [overlap, clearance]);
  return (
    <span
      {...props}
      ref={ref}
      className={["re-avatar-group", className].filter(Boolean).join(" ")}
    >
      {children}
    </span>
  );
}
