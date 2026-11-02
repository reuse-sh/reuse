"use client";

import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";
import { type Ref, useEffect, useRef } from "react";
import {
  type MenuSlug,
  menuGroups,
  menuLibrary,
  shortLines,
} from "../../lib/menu";
import { DocLink } from "../docs/doc-link";
import { Icon } from "../icons";
import { createLibraryPeek } from "./library-peek";

function rowsOf(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>("[data-menu-col]")].map(
    (column) => [...column.querySelectorAll<HTMLElement>("a")],
  );
}

function moveFocus(event: KeyboardEvent) {
  const root = event.currentTarget;
  const active = document.activeElement;
  if (!(root instanceof HTMLElement) || !(active instanceof HTMLElement))
    return;
  const columns = rowsOf(root);
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    const column = columns.findIndex((items) => items.includes(active));
    if (column < 0) return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = columns[(column + step + columns.length) % columns.length];
    const row = columns[column].indexOf(active);
    next[Math.min(row, next.length - 1)].focus();
    return;
  }
  const list = columns.flat();
  const index = list.indexOf(active);
  const moves: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowUp: index - 1,
    Home: 0,
    End: list.length - 1,
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  list[(moves[event.key] + list.length) % list.length].focus();
}

export function focusMenuRow(menu: HTMLElement | null) {
  const first =
    menu?.querySelector<HTMLElement>("a[data-current]") ??
    menu?.querySelector<HTMLElement>("a");
  first?.focus();
}

export function LibraryMenu({
  id,
  open,
  current,
  onNavigate,
  ref,
}: {
  id: string;
  open: boolean;
  current: string | null;
  onNavigate: () => void;
  ref: Ref<HTMLDivElement>;
}) {
  const rows = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rows.current;
    if (!root) return;
    const highlight = createMovingHighlight(root);
    const peek = createLibraryPeek();
    const tooltip = createFloatingTooltip(root, {
      selector: "[data-peek]",
      side: "bottom-right",
      sideOffset: 18,
      tilt: 5,
      delay: 90,
      className: "f-tip f-peek-tip",
      content: (row) =>
        row.matches(":focus-visible")
          ? null
          : peek.pane(row.dataset.peek as MenuSlug),
    });
    root.addEventListener("keydown", moveFocus);
    return () => {
      root.removeEventListener("keydown", moveFocus);
      tooltip.destroy();
      peek.destroy();
      highlight.destroy();
    };
  }, []);

  return (
    <div className="c-menu" id={id} ref={ref} hidden={!open}>
      <nav className="c-menu-cols" aria-label="Libraries" ref={rows}>
        {menuGroups.map(([title, slugs]) => (
          <div key={title} className="c-menu-col" data-menu-col>
            <p className="c-menu-h">{title}</p>
            {slugs.map((slug) => (
              <DocLink
                key={slug}
                href={`/${slug}`}
                className="c-menu-row"
                data-re-row
                data-peek={slug}
                data-current={slug === current ? "" : undefined}
                aria-current={slug === current ? "true" : undefined}
                onClick={onNavigate}
              >
                <Icon name={slug} size={18} />
                <span>
                  <b>{menuLibrary(slug).name}</b>
                  <small>{shortLines[slug]}</small>
                </span>
              </DocLink>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
