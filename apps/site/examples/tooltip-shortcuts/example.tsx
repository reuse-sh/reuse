"use client";
import {
  FloatingTooltipGroup,
  MovingHighlight,
} from "@reuse-sh/interactions/react";
import "./effects.css";

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
  minus: (
    <>
      <path
        d="M20 12L4 12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
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
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] ?? char,
  );
}
const photos = [
  {
    src: "https://reuse.sh/images/marble-lake.svg",
    alt: "A soft marble texture in coral, sand and blue",
    width: 1600,
    height: 1200,
  },
  {
    src: "https://reuse.sh/images/marble-mountains.svg",
    alt: "A soft marble texture in mint, blue and orange",
    width: 1600,
    height: 1200,
  },
  {
    src: "https://reuse.sh/images/marble-coast.svg",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 1600,
    height: 1200,
  },
];

function Template({ id, html }: { id: string; html: string }) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: the markup is built from fixed synthetic strings, escaped with escapeHtml.
  return <template id={id} dangerouslySetInnerHTML={{ __html: html }} />;
}

type Tool = readonly [
  icon: keyof typeof iconPaths,
  label: string,
  shortcut?: string,
];

function Toolbar({ tools, className }: { tools: Tool[]; className?: string }) {
  return (
    <MovingHighlight
      className={[
        "[border-radius:13px] bg-white [box-shadow:0_0_0_0.5px_rgb(0_0_0_/_8%),0_1px_2px_rgb(0_0_0_/_5%),0_4px_8px_rgb(0_0_0_/_3.5%)] [--re-highlight-background:rgb(0_0_0_/_3%)] [--re-highlight-radius:8px] flex gap-0.5 p-1 [&_button]:grid [&_button]:place-items-center [&_button]:w-8 [&_button]:h-8 [&_button]:p-0 [&_button]:border-0 [&_button]:[border-radius:8px] [&_button]:bg-transparent [&_button]:[color:#555] [&_button]:[transition:color_150ms_ease,_transform_160ms_cubic-bezier(0.23,_1,_0.32,_1)] [&_button:hover]:[color:#111] [&_button:active]:[transform:scale(0.94)] [&_button:focus-visible]:[outline-offset:-2px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="toolbar"
      aria-label="Photo actions"
    >
      {tools.map(([icon, label, shortcut]) =>
        shortcut ? (
          <span key={label} className="contents">
            <button
              type="button"
              aria-label={label}
              data-re-row=""
              data-re-tooltip-template={`tt-${icon}`}
            >
              <Icon name={icon} size={18} />
            </button>
            <Template
              id={`tt-${icon}`}
              html={`<span class="re-tooltip-shortcuts-f-tip-keys">${escapeHtml(label)}<kbd>${escapeHtml(shortcut)}</kbd></span>`}
            />
          </span>
        ) : (
          <button
            key={label}
            type="button"
            aria-label={label}
            data-re-row=""
            data-re-tooltip={label}
          >
            <Icon name={icon} size={18} />
          </button>
        ),
      )}
    </MovingHighlight>
  );
}

export function TooltipShortcuts() {
  return (
    <FloatingTooltipGroup tooltipClassName="re-tooltip-shortcuts-popup">
      <div>
        <div className="relative w-full [&_.re-tooltip-shortcuts-x-editor-photo]:[border-radius:0]">
          {/* biome-ignore lint/performance/noImgElement: this portable recipe uses a native image. */}
          <img
            src={photos[1].src}
            alt={photos[1].alt}
            width={1600}
            height={1200}
            className="h-auto re-tooltip-shortcuts-x-editor-photo w-full [aspect-ratio:16_/_10] block object-cover"
          />
          <Toolbar
            className="absolute [left:50%] [bottom:18px] [translate:-50%_0]"
            tools={[
              ["plus", "Zoom in", "⌘+"],
              ["minus", "Zoom out", "⌘−"],
              ["layers", "Duplicate", "⌘D"],
              ["link", "Copy link", "⌘L"],
              ["share", "Share", "⇧⌘S"],
              ["trash", "Delete", "⌫"],
            ]}
          />
        </div>
      </div>
    </FloatingTooltipGroup>
  );
}

export const Example = TooltipShortcuts;
