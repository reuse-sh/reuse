"use client";

import { createMovingHighlight } from "@reuse-sh/interactions";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { libraryAt } from "../../lib/menu";
import { DocLink as Link } from "../docs/doc-link";
import { Icon, type IconName } from "../icons";
import { focusMenuRow, LibraryMenu } from "./library-menu";

const MENU_ID = "c-library-menu";

export function SiteHeader() {
  const pathname = usePathname();
  const library = libraryAt(pathname);
  const [open, setOpen] = useState(false);
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
      if (!inside(event.target)) setOpen(false);
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
    <header className="c-head" ref={header}>
      <div
        className="c-head-in relative flex items-center h-[56px] px-[var(--gutter)]"
        ref={wrap}
      >
        <div className="c-brand" ref={brand}>
          <Link
            className="c-logo inline-flex items-center gap-[6px] h-[32px] [padding:0_8px] ml-[-8px] rounded-[8px] text-[14px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]"
            data-re-row
            href="/"
          >
            <Icon name="logo" size={16} />
            Reuse
          </Link>
          <span
            className="c-slash [margin:0_2px] text-[color:rgb(0_0_0_/_16%)] text-[15px]"
            aria-hidden="true"
          >
            /
          </span>
          <button
            ref={button}
            type="button"
            className="c-switch inline-flex items-center gap-[6px] min-w-[0] h-[32px] [padding:0_7px_0_9px] [border:0] rounded-[8px] [background:transparent] text-[14px] font-[520] text-[color:var(--ink)]"
            data-re-row
            data-highlighted={open ? "" : undefined}
            aria-expanded={open}
            aria-controls={MENU_ID}
            onClick={(event: MouseEvent) => {
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
            ) : null}
            <span>{library ? library.name : "Libraries"}</span>
            <Icon
              name="down"
              size={14}
              className="c-switch-chevron ml-[-2px] text-[color:var(--mute)] [transition:transform_220ms_var(--ease)]"
            />
          </button>
        </div>
        <nav className="c-nav" aria-label="Site" ref={nav}>
          <Link
            data-re-row
            href="/for-agents"
            aria-current={pathname === "/for-agents" ? "page" : undefined}
          >
            Agent guides
          </Link>
          <Link
            data-re-row
            href="/tools"
            aria-current={pathname === "/tools" ? "page" : undefined}
          >
            Tools
          </Link>
          <a
            data-re-row
            className="c-nav-icon"
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
