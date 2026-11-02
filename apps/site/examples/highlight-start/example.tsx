"use client";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import { useState } from "react";

const iconPaths = {
  annotations: (
    <>
      <path
        d="M14.0737 3.88545C14.8189 3.07808 15.1915 2.6744 15.5874 2.43893C16.5427 1.87076 17.7191 1.85309 18.6904 2.39232C19.0929 2.6158 19.4769 3.00812 20.245 3.79276C21.0131 4.5774 21.3972 4.96972 21.6159 5.38093C22.1438 6.37312 22.1265 7.57479 21.5703 8.5507C21.3398 8.95516 20.9446 9.33578 20.1543 10.097L10.7506 19.1543C9.25288 20.5969 8.504 21.3182 7.56806 21.6837C6.63212 22.0493 5.6032 22.0224 3.54536 21.9686L3.26538 21.9613C2.63891 21.9449 2.32567 21.9367 2.14359 21.73C1.9615 21.5234 1.98636 21.2043 2.03608 20.5662L2.06308 20.2197C2.20301 18.4235 2.27297 17.5255 2.62371 16.7182C2.97444 15.9109 3.57944 15.2555 4.78943 13.9445L14.0737 3.88545Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M13 4L20 11"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M14 22L22 22"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  avatars: (
    <>
      <path
        d="M18.4995 20.5C18.2663 17.5685 15.8417 15.2477 12.808 15.0521L11.9995 15C11.7107 15.0076 11.4416 15.0178 11.1877 15.0298C8.18075 15.1723 5.7304 17.5974 5.49951 20.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.2495 9.25C15.2495 11.0449 13.7944 12.5 11.9995 12.5C10.2046 12.5 8.74952 11.0449 8.74952 9.25C8.74952 7.45507 10.2046 6 11.9995 6C13.7944 6 15.2495 7.45507 15.2495 9.25Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M5.50249 8.5C5.17908 7.99485 4.99158 7.39432 4.99158 6.75C4.99158 4.95507 6.44665 3.5 8.24157 3.5C8.68752 3.5 9.1125 3.58982 9.49939 3.75235"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M18.4963 8.5C18.8197 7.99485 19.0072 7.39432 19.0072 6.75C19.0072 4.95507 17.5521 3.5 15.7572 3.5C15.3113 3.5 14.8863 3.58982 14.4994 3.75235"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M22.0007 17.9996C21.8208 15.7374 19.9995 13.5 17.9995 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M1.99927 17.9996C2.17923 15.7374 4.00049 13.5 6.00049 13"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  book: (
    <>
      <path
        d="M7.99978 3.5H6.60021C4.43183 3.5 3.34764 3.5 2.67399 4.17362C2.00034 4.84724 2.00029 5.93144 2.00021 8.09982L2 13.3998C1.99992 15.5684 1.99987 16.6526 2.67353 17.3263C3.34719 18 4.43146 18 6.6 18H8.95042C10.4329 18 11.7092 19.0464 11.9999 20.5V5.5C11.0556 4.24097 9.99989 3.5 7.99978 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M16.0001 3.5H17.3997C19.5681 3.5 20.6523 3.5 21.3259 4.17362C21.9996 4.84724 21.9996 5.93144 21.9997 8.09982L21.9999 13.3998C22 15.5684 22 16.6526 21.3264 17.3263C20.6527 18 19.5684 18 17.3999 18H15.0495C13.567 18 12.2907 19.0464 12 20.5V5.5C12.9443 4.24097 14 3.5 16.0001 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
  lightbox: (
    <>
      <path
        d="M3 16L7.46967 11.5303C7.80923 11.1908 8.26978 11 8.75 11C9.23022 11 9.69077 11.1908 10.0303 11.5303L14 15.5M15.5 17L14 15.5M21 16L18.5303 13.5303C18.1908 13.1908 17.7302 13 17.25 13C16.7698 13 16.3092 13.1908 15.9697 13.5303L14 15.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M15.5 8C15.7761 8 16 7.77614 16 7.5C16 7.22386 15.7761 7 15.5 7M15.5 8C15.2239 8 15 7.77614 15 7.5C15 7.22386 15.2239 7 15.5 7M15.5 8V7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3.69797 19.7472C2.5 18.3446 2.5 16.2297 2.5 12C2.5 7.77027 2.5 5.6554 3.69797 4.25276C3.86808 4.05358 4.05358 3.86808 4.25276 3.69797C5.6554 2.5 7.77027 2.5 12 2.5C16.2297 2.5 18.3446 2.5 19.7472 3.69797C19.9464 3.86808 20.1319 4.05358 20.302 4.25276C21.5 5.6554 21.5 7.77027 21.5 12C21.5 16.2297 21.5 18.3446 20.302 19.7472C20.1319 19.9464 19.9464 20.1319 19.7472 20.302C18.3446 21.5 16.2297 21.5 12 21.5C7.77027 21.5 5.6554 21.5 4.25276 20.302C4.05358 20.1319 3.86808 19.9464 3.69797 19.7472Z"
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
export function Example() {
  const [selected, setSelected] = useState("Overview");
  return (
    <div className="flex flex-col items-center justify-center">
      <MovingHighlight className="rounded-xl bg-card shadow-raised [&_.re-moving-highlight]:bg-accent [&_.re-moving-highlight]:rounded-lg grid gap-px w-58 max-w-full p-1.5 [&_button]:flex [&_button_span]:flex-1 [&_button]:items-center [&_button]:gap-2.5 [&_button]:h-8 [&_button]:px-2.5 [&_button]:border-0 [&_button]:rounded-lg [&_button]:bg-transparent [&_button]:text-ui [&_button]:text-left [&_svg]:text-muted-foreground [&_kbd]:min-w-0 [&_kbd]:h-auto [&_kbd]:p-0 [&_kbd]:bg-transparent [&_kbd]:shadow-none [&_kbd]:text-subtle-foreground [&_kbd]:text-caption [&_kbd]:font-normal [&_button:focus-visible]:-outline-offset-2">
        {[
          { label: "Overview", icon: "book" },
          { label: "Image library", icon: "lightbox" },
          { label: "Annotations", icon: "annotations" },
          { label: "Team", icon: "avatars" },
        ].map((item) => (
          <button
            type="button"
            data-re-row=""
            aria-pressed={selected === item.label}
            data-current={selected === item.label ? "" : undefined}
            key={item.label}
            onClick={() => setSelected(item.label)}
          >
            <Icon name={item.icon as keyof typeof iconPaths} size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </MovingHighlight>
    </div>
  );
}
