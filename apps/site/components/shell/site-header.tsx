"use client";

import {
  createFloatingTooltip,
  createMovingHighlight,
} from "@reuse-sh/interactions";
import { isStageEvent } from "@reuse-sh/stage";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useMenuTriggerFocus } from "@/lib/use-menu-trigger-focus";
import { cn } from "@/lib/utils";
import { libraryAt } from "../../lib/menu";
import { DocLink as Link } from "../docs/doc-link";
import { Icon, type IconName } from "../icons";
import { focusMenuRow, LibraryMenu } from "./library-menu";
import { Logo } from "./logo";

const MENU_ID = "library-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const library = libraryAt(pathname);
  const [open, setOpen] = useState(false);
  const { onClick: trackTriggerClick, ...triggerFocus } = useMenuTriggerFocus();
  const header = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const brand = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef(false);

  useEffect(() => {
    const controllers = [brand.current, nav.current].flatMap((root) =>
      root ? [createMovingHighlight(root)] : [],
    );
    return () => {
      for (const controller of controllers) controller.destroy();
    };
  }, []);

  useEffect(() => {
    const logo = brand.current?.querySelector<HTMLElement>("[data-re-tooltip]");
    if (!brand.current || !logo) return;
    const tooltip = createFloatingTooltip(brand.current, {
      selector: "[data-re-tooltip]",
      track: { y: "anchor" },
      sideOffset: logo.offsetHeight / 2 + 10,
      tilt: 5,
      className: "f-tip",
    });
    return () => tooltip.destroy();
  }, []);

  useEffect(() => {
    const head = header.current;
    if (!head) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      head.toggleAttribute("data-scrolled", window.scrollY > 4);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the menu closes whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    if (focusOnOpen.current) focusMenuRow(menu.current);
    focusOnOpen.current = false;
    const inside = (target: EventTarget | null) =>
      target instanceof Node &&
      Boolean(
        menu.current?.contains(target) || button.current?.contains(target),
      );
    const onDown = (event: PointerEvent) => {
      if (!inside(event.target) && !isStageEvent(event)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget && !inside(event.relatedTarget)) setOpen(false);
    };
    const head = wrap.current;
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onEscape);
    head?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onEscape);
      head?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  const show = (focus: boolean) => {
    focusOnOpen.current = focus;
    setOpen(true);
    if (focus && open) focusMenuRow(menu.current);
  };

  return (
    <header
      className="site-header sticky top-0 z-30 bg-background/85 backdrop-blur-md transition-shadow duration-200 data-scrolled:shadow-ring"
      ref={header}
    >
      <div className="relative flex h-header items-center px-gutter" ref={wrap}>
        <div
          className="moving-highlight flex min-w-0 items-center gap-0.5 max-sm:gap-0"
          ref={brand}
        >
          <Link
            className="-ml-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground"
            data-re-row
            href="/"
            aria-label="Reuse"
            data-re-tooltip="Reuse · Interface parts for any stack"
          >
            <Logo />
          </Link>
          <span
            className="mx-0.5 text-body text-foreground/15 max-sm:mx-0"
            aria-hidden="true"
          >
            /
          </span>
          <button
            {...triggerFocus}
            ref={button}
            type="button"
            className="inline-flex h-8 min-w-0 items-center gap-1.5 rounded-lg bg-transparent px-2 text-ui font-medium text-foreground max-sm:min-w-8 max-sm:shrink-0 [&_svg]:shrink-0"
            data-re-row
            data-highlighted={open ? "" : undefined}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={(event: MouseEvent) => {
              trackTriggerClick(event);
              if (open) setOpen(false);
              else show(event.detail === 0);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return;
              event.preventDefault();
              show(true);
            }}
          >
            {library ? (
              <Icon name={library.slug as IconName} size={16} />
            ) : (
              <Icon name="book" size={16} className="sm:hidden" />
            )}
            <span className="truncate max-sm:sr-only">
              {library ? library.name : "Libraries"}
            </span>
            <Icon
              name="down"
              size={14}
              className={cn(
                "-ml-0.5 shrink-0 text-subtle-foreground transition-transform duration-200 ease-ui max-sm:hidden",
                open && "rotate-180",
              )}
            />
          </button>
        </div>
        <nav
          className="moving-highlight -mr-2 ml-auto flex shrink-0 items-center gap-0.5"
          aria-label="Site"
          ref={nav}
        >
          <Link
            data-re-row
            className="inline-flex h-8 items-center rounded-lg px-1 text-ui whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground sm:px-2.5"
            href="/for-agents"
            aria-current={pathname === "/for-agents" ? "page" : undefined}
          >
            Agent guides
          </Link>
          <Link
            data-re-row
            className="inline-flex h-8 items-center rounded-lg px-1 text-ui whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground sm:px-2.5"
            href="/tools"
            aria-current={pathname === "/tools" ? "page" : undefined}
          >
            Tools
          </Link>
          <a
            data-re-row
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            href="https://github.com/reuse-sh/reuse"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            data-re-tooltip="GitHub"
          >
            <Icon name="github" size={18} />
          </a>
        </nav>
        <LibraryMenu
          id={MENU_ID}
          ref={menu}
          open={open}
          current={library?.slug ?? null}
          onNavigate={() => setOpen(false)}
        />
      </div>
    </header>
  );
}
