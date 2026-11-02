"use client";

import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";
import { type Ref, useEffect, useRef } from "react";
import { MenuSurface } from "@/components/ui/surfaces";
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
    <MenuSurface
      className="library-menu absolute top-full left-gutter z-2 -mt-1 -ml-2 overflow-y-auto overscroll-contain"
      id={id}
      ref={ref}
      hidden={!open}
    >
      <nav
        className="moving-highlight grid grid-cols-1 gap-x-1.5 sm:grid-cols-2 md:grid-cols-3"
        aria-label="Libraries"
        ref={rows}
      >
        {menuGroups.map(([title, slugs]) => (
          <div key={title} data-menu-col>
            <p className="px-2.5 pt-2 pb-1.5 text-caption font-medium text-subtle-foreground">
              {title}
            </p>
            {slugs.map((slug) => (
              <DocLink
                key={slug}
                href={`/${slug}`}
                className="group flex items-start gap-2.5 rounded-control px-2.5 py-2 text-foreground focus-visible:-outline-offset-2"
                data-re-row
                data-peek={slug}
                data-current={slug === current ? "" : undefined}
                aria-current={slug === current ? "true" : undefined}
                onClick={onNavigate}
              >
                <Icon
                  name={slug}
                  size={18}
                  className="mt-0.5 shrink-0 text-muted-foreground group-data-current:text-foreground"
                />
                <span className="min-w-0">
                  <b className="block text-ui font-medium">
                    {menuLibrary(slug).name}
                  </b>
                  <small className="block text-caption text-subtle-foreground">
                    {shortLines[slug]}
                  </small>
                </span>
              </DocLink>
            ))}
          </div>
        ))}
      </nav>
    </MenuSurface>
  );
}
