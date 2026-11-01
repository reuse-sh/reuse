"use client";

import { docSections, type Library, libraries } from "@reuse-sh/catalog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./icons";

export function LibraryMenu() {
  const menu = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    if (pathname) menu.current?.hidePopover();
  }, [pathname]);
  return (
    <div className="library-switcher">
      <button
        type="button"
        popoverTarget="library-menu"
        className="nav-trigger"
      >
        Libraries <Icon name="down" size={13} />
      </button>
      <div
        ref={menu}
        id="library-menu"
        popover="auto"
        className="library-popover reuse-shadow-ring-lg"
      >
        <nav aria-label="Libraries">
          {libraries.map((library) => (
            <Link
              href={`/${library.slug}`}
              key={library.slug}
              onClick={() => menu.current?.hidePopover()}
            >
              <Icon name={library.slug as IconName} size={20} />
              <span>
                <strong>{library.name}</strong>
                <small>{library.description}</small>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function LibrarySidebar({ library }: { library: Library }) {
  const pathname = usePathname();
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (pathname && disclosure.current) disclosure.current.open = false;
  }, [pathname]);
  const links = (
    <>
      <Link
        href={`/${library.slug}`}
        aria-current={pathname === `/${library.slug}` ? "page" : undefined}
      >
        Overview
      </Link>
      {docSections.map((section) => (
        <Link
          href={`/${library.slug}/${section.slug}`}
          key={section.slug}
          aria-current={
            pathname.endsWith(`/${section.slug}`) ? "page" : undefined
          }
        >
          {section.title}
        </Link>
      ))}
      <a href={`/${library.slug}/guide.md`}>
        Agent guide <Icon name="arrow" size={12} />
      </a>
    </>
  );
  return (
    <>
      <aside className="library-sidebar">
        <Link href={`/${library.slug}`} className="sidebar-title">
          <Icon name={library.slug as IconName} />
          {library.name}
        </Link>
        <nav aria-label={`${library.name} documentation`}>{links}</nav>
        <div className="sidebar-bottom">
          <Link href="/how-to-use">How to use</Link>
          <a href="https://opensource.org/license/mit">
            MIT License <Icon name="arrow" size={12} />
          </a>
        </div>
      </aside>
      <details ref={disclosure} className="mobile-library-nav">
        <summary>
          <Icon name={library.slug as IconName} />
          {library.name} documentation <Icon name="down" size={13} />
        </summary>
        <nav aria-label="Mobile library documentation">{links}</nav>
      </details>
    </>
  );
}
