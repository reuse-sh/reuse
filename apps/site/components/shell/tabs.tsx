"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import { type KeyboardEvent, type ReactNode, useEffect, useRef } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
}

const tabId = (base: string, id: string) => `${base}-tab-${id}`;
const panelId = (base: string, id: string) => `${base}-panel-${id}`;

export function tabPanelProps(base: string, id: string, selected: string) {
  return {
    id: panelId(base, id),
    role: "tabpanel",
    "aria-labelledby": tabId(base, id),
    hidden: id !== selected,
    tabIndex: 0,
  } as const;
}

export function Tabs({
  idBase,
  items,
  selected,
  onSelect,
  label,
  className,
}: {
  idBase: string;
  items: TabItem[];
  selected: string;
  onSelect: (id: string) => void;
  label?: string;
  className?: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = list.current;
    if (!root) return;
    const pill = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: '[aria-selected="true"]',
      mode: "selected",
      className: "c-tab-pill",
    });
    const hover = createMovingHighlight(root, {
      rowSelector: '[role="tab"]',
      selectedSelector: "[data-reuse-none]",
      mode: "hover",
      className: "c-tab-hover",
    });
    return () => {
      hover.destroy();
      pill.destroy();
    };
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === selected);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = items[(moves[event.key] + items.length) % items.length];
    onSelect(next.id);
    document.getElementById(tabId(idBase, next.id))?.focus();
  };

  return (
    <div
      ref={list}
      role="tablist"
      aria-label={label}
      className={["c-tabs", className].filter(Boolean).join(" ")}
      onKeyDown={onKeyDown}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          id={tabId(idBase, item.id)}
          aria-selected={item.id === selected}
          aria-controls={panelId(idBase, item.id)}
          tabIndex={item.id === selected ? 0 : -1}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
