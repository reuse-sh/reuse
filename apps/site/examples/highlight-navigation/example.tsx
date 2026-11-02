"use client";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import { type ReactNode, useState } from "react";

const iconPaths = {
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
  doc: (
    <>
      <path
        d="M16.5 2V5M7.5 2V5M12 2V5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M13 3.5H11C7.70017 3.5 6.05025 3.5 5.02513 4.52513C4 5.55025 4 7.20017 4 10.5V15C4 18.2998 4 19.9497 5.02513 20.9749C6.05025 22 7.70017 22 11 22H13C16.2998 22 17.9497 22 18.9749 20.9749C20 19.9497 20 18.2998 20 15V10.5C20 7.20017 20 5.55025 18.9749 4.52512C17.9497 3.5 16.2998 3.5 13 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M8 15H12M8 11H16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </>
  ),
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
const pages: [ReactNode, string, string, number?][] = [
  [<Icon key="i" name="lightbox" size={16} />, "Prints", "24 prints", 3],
  [<Icon key="i" name="heart" size={16} />, "Favorites", "8 prints"],
  [<Icon key="i" name="share" size={16} />, "Shared with me", "5 prints", 2],
  [<Icon key="i" name="avatars" size={16} />, "Members", "6 people"],
  [<Icon key="i" name="doc" size={16} />, "Drafts", "2 drafts"],
];

export function NavigationList() {
  const [current, setCurrent] = useState(0);
  const [, label, summary] = pages[current];
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-panel flex min-h-75 max-md:flex-col">
      <nav
        aria-label="Workspace"
        className="w-55 shrink-0 py-3.5 px-2 bg-secondary border-r border-border max-md:w-full max-md:border-r-0 max-md:border-b"
      >
        <p className="px-4 pt-0.5 pb-1.5 text-label font-semibold">
          Ink and Paper
        </p>
        <MovingHighlight className="[&_.re-moving-highlight]:bg-accent [&_.re-moving-highlight]:rounded-lg grid gap-px p-1.5">
          {pages.map(([icon, name, , count], index) => (
            <a
              key={name}
              href={`#x-nav-${index}`}
              className="flex items-center gap-2.5 h-8.5 px-2.5 border-0 rounded-lg bg-transparent text-foreground text-ui text-left cursor-pointer [&:focus-visible]:outline-2 [&:focus-visible]:outline-ring [&:focus-visible]:-outline-offset-2 [&[aria-current=page]]:font-semibold"
              data-re-row=""
              data-current={index === current ? "" : undefined}
              aria-current={index === current ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(index);
              }}
            >
              <span className="re-highlight-navigation-x-row-icon inline-flex flex-none text-muted-foreground">
                {icon}
              </span>
              <span>{name}</span>
              {count ? (
                <small className="ml-auto text-caption text-subtle-foreground">
                  {count}
                </small>
              ) : null}
            </a>
          ))}
        </MovingHighlight>
      </nav>
      <section className="min-w-0 flex-1 p-6" aria-live="polite">
        <h2 className="text-subsection leading-6.5 font-semibold tracking-tight">
          {label}
        </h2>
        <p className="mt-1 text-ui text-muted-foreground">{summary}</p>
      </section>
    </div>
  );
}

export const Example = NavigationList;
