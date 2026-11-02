"use client";
import {
  docHref,
  docPages,
  findLibrary,
  isDocGroup,
  type Library,
} from "@reuse-sh/catalog";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";
import { Icon } from "../icons";
import { DocLink } from "./doc-link";

function Toc({
  library,
  pathname,
  before,
}: {
  library: Library;
  pathname: string;
  before?: ReactNode;
}) {
  const link = (path: string, title: string) => (
    <DocLink
      key={path}
      href={docHref(library, path)}
      aria-current={pathname === docHref(library, path) ? "page" : undefined}
      className="block py-0.5 text-sidebar-foreground transition-colors hover:text-muted-foreground aria-[current=page]:text-sidebar-active"
    >
      {title}
    </DocLink>
  );
  return (
    <nav
      className="flex flex-col text-label leading-6"
      aria-label={`${library.name} pages`}
    >
      {before}
      {library.pages.map((entry) =>
        isDocGroup(entry) ? (
          <div
            key={entry.title}
            className="group"
            data-open={
              entry.pages.some(
                (page) => docHref(library, page.path) === pathname,
              )
                ? ""
                : undefined
            }
          >
            <span className="block py-0.5 text-sidebar-foreground group-data-[open]:text-muted-foreground">
              {entry.title}
            </span>
            <div className="my-0.5 ml-0.5 border-l border-border pl-3">
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
export function DocsSidebar({
  slug,
  before,
}: {
  slug: string;
  before?: ReactNode;
}) {
  const pathname = usePathname();
  const library = findLibrary(slug);
  if (!library) return null;
  return (
    <aside
      data-slot="docs-sidebar"
      className="fixed top-30 left-gutter z-10 hidden w-sidebar wide:block"
    >
      <Toc library={library} pathname={pathname} before={before} />
    </aside>
  );
}
export function DocsDisclosure({
  slug,
  before,
}: {
  slug: string;
  before?: ReactNode;
}) {
  const pathname = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: route changes close the mobile disclosure.
  useEffect(() => {
    if (details.current) details.current.open = false;
  }, [pathname]);
  const library = findLibrary(slug);
  if (!library) return null;
  const current = docPages(library).find(
    (page) => docHref(library, page.path) === pathname,
  );
  return (
    <details
      ref={details}
      data-slot="docs-disclosure"
      className="group mb-8 rounded-panel bg-card shadow-raised wide:hidden"
    >
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-ui font-medium [&::-webkit-details-marker]:hidden">
        <span>{current?.title ?? library.name}</span>
        <Icon
          name="down"
          className="size-3.5 text-subtle-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-4 pt-1 pb-4">
        <Toc library={library} pathname={pathname} before={before} />
      </div>
    </details>
  );
}
