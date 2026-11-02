"use client";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import { type KeyboardEvent, useRef, useState } from "react";

const iconPaths = {
  layers: (
    <>
      <path
        d="M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M20.788 11.0972C20.9293 11.2959 21 11.5031 21 11.7309C21 12.7127 19.6873 13.3109 17.0618 14.5072L15.357 15.284C13.7048 16.0368 12.8786 16.4133 12 16.4133C11.1214 16.4133 10.2952 16.0368 8.64298 15.284L6.93817 14.5072C4.31272 13.3109 3 12.7127 3 11.7309C3 11.5031 3.07067 11.2959 3.212 11.0972"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M20.3767 16.2661C20.7922 16.5971 21 16.927 21 17.3176C21 18.2995 19.6873 18.8976 17.0618 20.0939L15.357 20.8707C13.7048 21.6236 12.8786 22 12 22C11.1214 22 10.2952 21.6236 8.64298 20.8707L6.93817 20.0939C4.31272 18.8976 3 18.2995 3 17.3176C3 16.927 3.20778 16.5971 3.62334 16.2661"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  link: (
    <>
      <path
        d="M9.14339 10.691L9.35031 10.4841C11.329 8.50532 14.5372 8.50532 16.5159 10.4841C18.4947 12.4628 18.4947 15.671 16.5159 17.6497L13.6497 20.5159C11.671 22.4947 8.46279 22.4947 6.48405 20.5159C4.50532 18.5372 4.50532 15.329 6.48405 13.3503L6.9484 12.886"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M17.0516 11.114L17.5159 10.6497C19.4947 8.67095 19.4947 5.46279 17.5159 3.48405C15.5372 1.50532 12.329 1.50532 10.3503 3.48405L7.48405 6.35031C5.50532 8.32904 5.50532 11.5372 7.48405 13.5159C9.46279 15.4947 12.671 15.4947 14.6497 13.5159L14.8566 13.309"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </>
  ),
  plus: (
    <>
      <path
        d="M12 4V20M20 12H4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  share: (
    <>
      <path
        d="M21 6.5C21 8.15685 19.6569 9.5 18 9.5C16.3431 9.5 15 8.15685 15 6.5C15 4.84315 16.3431 3.5 18 3.5C19.6569 3.5 21 4.84315 21 6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 12C9 13.6569 7.65685 15 6 15C4.34315 15 3 13.6569 3 12C3 10.3431 4.34315 9 6 9C7.65685 9 9 10.3431 9 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M21 17.5C21 19.1569 19.6569 20.5 18 20.5C16.3431 20.5 15 19.1569 15 17.5C15 15.8431 16.3431 14.5 18 14.5C19.6569 14.5 21 15.8431 21 17.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8.72852 10.7495L15.2285 7.75M8.72852 13.25L15.2285 16.2495"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </>
  ),
  trash: (
    <>
      <path
        d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M9.5 16.5L9.5 10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 16.5L14.5 10.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </>
  ),
};
function Icon({
  name,
  size = 18,
}: {
  name: keyof typeof iconPaths;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  );
}
const step = (key: string, index: number, count: number) => {
  const moves: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowRight: index + 1,
    ArrowUp: index - 1,
    ArrowLeft: index - 1,
    Home: 0,
    End: count - 1,
  };
  return key in moves ? (moves[key] + count) % count : null;
};

const menuItems: [keyof typeof iconPaths, string, string][] = [
  ["plus", "New print", "⌘N"],
  ["layers", "Duplicate", "⌘D"],
  ["link", "Copy link", "⌘L"],
  ["share", "Share", "⇧⌘S"],
  ["trash", "Move to trash", "⌫"],
];

export function FileMenu() {
  const [focus, setFocus] = useState(0);
  const [last, setLast] = useState<string | null>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") return;
    const next = step(event.key, focus, menuItems.length);
    if (next === null) return;
    event.preventDefault();
    setFocus(next);
    items.current[next]?.focus();
  };
  return (
    <div className="overflow-hidden [border-radius:16px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_2px_4px_rgb(0_0_0_/_4%),0_8px_16px_rgb(0_0_0_/_5%)] [max-width:340px] [padding-bottom:6px]">
      <div
        className="flex gap-0.5 p-1.5 [box-shadow:inset_0_-1px_rgb(0_0_0_/_6%)] [font-size:13px] [color:#5b5b5b] [&_[data-open]]:[background:rgb(0_0_0_/_6%)] [&_[data-open]]:[color:#111]"
        aria-hidden="true"
      >
        <span className="[padding:3px_9px] [border-radius:7px]" data-open="">
          File
        </span>
        <span className="[padding:3px_9px] [border-radius:7px]">Edit</span>
        <span className="[padding:3px_9px] [border-radius:7px]">View</span>
      </div>
      <MovingHighlight
        role="menu"
        aria-label="File"
        className="[--re-highlight-background:rgb(0_0_0_/_3%)] [--re-highlight-radius:8px] grid gap-px p-1.5"
        onKeyDown={onKeyDown}
      >
        {menuItems.map(([icon, label, shortcut], index) => (
          <button
            key={label}
            ref={(node) => {
              items.current[index] = node;
            }}
            type="button"
            role="menuitem"
            data-re-row=""
            tabIndex={index === focus ? 0 : -1}
            className={
              index === menuItems.length - 1
                ? "flex items-center gap-2.5 [height:34px] [padding:0_10px] border-0 [border-radius:8px] bg-transparent [font-size:13.5px] text-left cursor-pointer [&:focus-visible]:[outline:2px_solid_#111] [&:focus-visible]:[outline-offset:-2px] [&[aria-current=page]]:[font-weight:560] [margin-top:6px] [color:#c2362b] [box-shadow:0_-4px_0_-3px_rgb(0_0_0_/_7%)] [&_.re-highlight-menu-x-row-icon]:[color:currentColor]"
                : "flex items-center gap-2.5 [height:34px] [padding:0_10px] border-0 [border-radius:8px] bg-transparent [color:#111] [font-size:13.5px] text-left cursor-pointer [&:focus-visible]:[outline:2px_solid_#111] [&:focus-visible]:[outline-offset:-2px] [&[aria-current=page]]:[font-weight:560]"
            }
            onFocus={() => setFocus(index)}
            onClick={() => setLast(label)}
          >
            <span className="re-highlight-menu-x-row-icon inline-flex flex-none [color:#5b5b5b]">
              <Icon name={icon} size={16} />
            </span>
            <span>{label}</span>
            <kbd className="ml-auto [font-family:inherit] [font-size:12px] [color:#858585]">
              {shortcut}
            </kbd>
          </button>
        ))}
      </MovingHighlight>
      <p
        className="[padding:2px_16px_6px] [font-size:12.5px] [color:#858585]"
        aria-live="polite"
      >
        {last ? `Chose ${last}` : " "}
      </p>
    </div>
  );
}

export const Example = FileMenu;

import "@reuse-sh/interactions/styles.css";
