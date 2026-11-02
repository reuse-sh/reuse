"use client";
import {
  FloatingTooltipGroup,
  MovingHighlight,
} from "@reuse-sh/interactions/react";

const iconPaths = {
  heart: (
    <>
      <path
        d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
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
  zoom: (
    <>
      <path
        d="M18.5016 19.1217L21 21.6217M20 15.1217C20 12.0842 17.5376 9.62173 14.5 9.62173C11.4624 9.62173 9 12.0842 9 15.1217C9 18.1593 11.4624 20.6217 14.5 20.6217C17.5376 20.6217 20 18.1593 20 15.1217Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 13.1217V17.1217M16.5 15.1217H12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 3.62173H14M3 10.6217V14.6217M6.5 21.6217C4.567 21.6217 3 20.0547 3 18.1217M17.5 3.62173C19.433 3.62173 21 5.18873 21 7.12173M3 7.12173C3 5.18873 4.567 3.62173 6.5 3.62173"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
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
    <ToolbarSurface className={className}>
      <MovingHighlight
        className="[&_.re-moving-highlight]:bg-accent [&_.re-moving-highlight]:rounded-lg flex gap-0.5 [&_button]:grid [&_button]:place-items-center [&_button]:size-8 [&_button]:p-0 [&_button]:border-0 [&_button]:rounded-lg [&_button]:bg-transparent [&_button]:text-muted-foreground [&_button]:transition [&_button]:duration-150 [&_button]:ease-ui [&_button:hover]:text-foreground [&_button:active]:scale-95 [&_button:focus-visible]:-outline-offset-2"
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
                html={`<span class="inline-flex items-center gap-2 whitespace-nowrap [&_kbd]:inline-grid [&_kbd]:place-items-center [&_kbd]:min-w-4.5 [&_kbd]:h-4 [&_kbd]:px-1 [&_kbd]:m-0 [&_kbd]:rounded-full [&_kbd]:bg-tooltip-foreground/15 [&_kbd]:text-tooltip-foreground/80 [&_kbd]:font-sans [&_kbd]:text-caption [&_kbd]:font-medium [&_kbd]:leading-none [&_kbd]:shadow-none">${escapeHtml(label)}<kbd>${escapeHtml(shortcut)}</kbd></span>`}
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
    </ToolbarSurface>
  );
}

export function Example() {
  return (
    <FloatingTooltipGroup tooltipClassName="re-tooltip-start-popup">
      <Toolbar
        tools={[
          ["zoom", "Zoom in"],
          ["heart", "Add to favorites"],
          ["share", "Share"],
          ["link", "Copy link"],
          ["trash", "Move to trash"],
        ]}
      />
    </FloatingTooltipGroup>
  );
}

import "./effects.css";
import { Toolbar as ToolbarSurface } from "@/components/ui/surfaces";
