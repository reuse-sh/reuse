"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "../icons";
import { DocIcon, type DocIconName } from "./doc-icon";

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

const menuItems: [DocIconName, string, string][] = [
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
    <div className="x-app x-app-menu">
      <div className="x-menubar" aria-hidden="true">
        <span className="x-menubar-item" data-open="">
          File
        </span>
        <span className="x-menubar-item">Edit</span>
        <span className="x-menubar-item">View</span>
      </div>
      <MovingHighlight
        role="menu"
        aria-label="File"
        className="x-menu"
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
              index === menuItems.length - 1 ? "x-row x-menu-danger" : "x-row"
            }
            onFocus={() => setFocus(index)}
            onClick={() => setLast(label)}
          >
            <span className="x-row-icon">
              <DocIcon name={icon} size={16} />
            </span>
            <span>{label}</span>
            <kbd className="x-row-key">{shortcut}</kbd>
          </button>
        ))}
      </MovingHighlight>
      <p className="x-menu-status" aria-live="polite">
        {last ? `Chose ${last}` : " "}
      </p>
    </div>
  );
}

const pages: [ReactNode, string, string, number?][] = [
  [<Icon key="i" name="lightbox" size={16} />, "Prints", "24 prints", 3],
  [<Icon key="i" name="heart" size={16} />, "Favorites", "8 prints"],
  [<Icon key="i" name="share" size={16} />, "Shared with me", "5 prints", 2],
  [<Icon key="i" name="avatars" size={16} />, "Members", "6 people"],
  [<DocIcon key="i" name="doc" size={16} />, "Drafts", "2 drafts"],
];

export function NavigationList() {
  const [current, setCurrent] = useState(0);
  const [, label, summary] = pages[current];
  return (
    <div className="x-app x-app-nav">
      <nav aria-label="Workspace" className="x-nav-side">
        <p className="x-nav-title">Ink and Paper</p>
        <MovingHighlight className="x-nav">
          {pages.map(([icon, name, , count], index) => (
            <a
              key={name}
              href={`#x-nav-${index}`}
              className="x-row"
              data-re-row=""
              data-current={index === current ? "" : undefined}
              aria-current={index === current ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(index);
              }}
            >
              <span className="x-row-icon">{icon}</span>
              <span>{name}</span>
              {count ? <small className="x-row-count">{count}</small> : null}
            </a>
          ))}
        </MovingHighlight>
      </nav>
      <section className="x-nav-main" aria-live="polite">
        <h2 className="x-nav-heading">{label}</h2>
        <p className="x-nav-summary">{summary}</p>
      </section>
    </div>
  );
}

const tabs = [
  [
    "Overview",
    "Nine prints, two waiting for review. The next proof ships on Friday.",
  ],
  [
    "Prints",
    "Coral sky, Mint and ember, Lilac bloom and six more, in print order.",
  ],
  ["Orders", "14 orders this week. Three are framed and wait for the courier."],
  [
    "Settings",
    "Who can see the series, how prints are named, and where proofs go.",
  ],
] as const;

export function HighlightTabs() {
  const list = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const fill = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: '[aria-selected="true"]',
      mode: "selected",
      className: "x-tab-fill",
    });
    const hover = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: "[data-re-none]",
      mode: "hover",
      className: "x-tab-hover",
    });
    return () => {
      hover.destroy();
      fill.destroy();
    };
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") return;
    const next = step(event.key, selected, tabs.length);
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    document.getElementById(`x-tab-${next}`)?.focus();
  };
  return (
    <div className="x-app x-app-tabs">
      <header className="x-tabs-head">
        <h2 className="x-tabs-title">Spring catalogue</h2>
        <div
          ref={list}
          role="tablist"
          aria-label="Project"
          className="x-tabs"
          onKeyDown={onKeyDown}
        >
          {tabs.map(([name], index) => (
            <button
              key={name}
              id={`x-tab-${index}`}
              type="button"
              role="tab"
              className="x-tab"
              aria-selected={index === selected}
              aria-controls="x-tab-panel"
              tabIndex={index === selected ? 0 : -1}
              onClick={() => setSelected(index)}
            >
              {name}
            </button>
          ))}
        </div>
      </header>
      <div
        id="x-tab-panel"
        role="tabpanel"
        aria-labelledby={`x-tab-${selected}`}
        className="x-tab-panel"
      >
        {tabs[selected][1]}
      </div>
    </div>
  );
}
