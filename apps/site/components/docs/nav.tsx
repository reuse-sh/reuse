"use client";

import {
  docHref,
  docPages,
  findLibrary,
  isDocGroup,
  type Library,
} from "@reuse-sh/catalog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Icon } from "../icons";

function Toc({ library, pathname }: { library: Library; pathname: string }) {
  const link = (path: string, title: string) => {
    const href = docHref(library, path);
    return (
      <Link
        key={path}
        href={href}
        aria-current={pathname === href ? "page" : undefined}
      >
        {title}
      </Link>
    );
  };
  return (
    <nav className="d-toc" aria-label={`${library.name} pages`}>
      {library.pages.map((entry) =>
        isDocGroup(entry) ? (
          <div
            key={entry.title}
            className="d-toc-group"
            data-open={
              entry.pages.some(
                (page) => docHref(library, page.path) === pathname,
              )
                ? ""
                : undefined
            }
          >
            <span className="d-toc-label">{entry.title}</span>
            <div className="d-toc-sub">
              {entry.pages.map((page) => link(page.path, page.title))}
            </div>
          </div>
        ) : (
          link(entry.path, entry.title)
        ),
      )}
    </nav>
  );
}

export function DocsSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const library = findLibrary(slug);
  if (!library) return null;
  return (
    <aside className="d-side">
      <Toc library={library} pathname={pathname} />
    </aside>
  );
}

export function DocsDisclosure({ slug }: { slug: string }) {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: the disclosure closes whenever the route changes.
  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [pathname]);
  const library = findLibrary(slug);
  if (!library) return null;
  const current = docPages(library).find(
    (page) => docHref(library, page.path) === pathname,
  );
  return (
    <details ref={details} className="d-toc-m">
      <summary>
        <span>{current?.title ?? library.name}</span>
        <Icon name="down" size={14} className="d-chevron" />
      </summary>
      <Toc library={library} pathname={pathname} />
    </details>
  );
}
