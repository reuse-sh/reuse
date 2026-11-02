import type { ReactNode } from "react";
import { DocsDisclosure, DocsSidebar } from "./nav";

export function LibraryFrame({
  slug,
  before,
  currentPath,
  children,
}: {
  slug: string;
  before?: ReactNode;
  currentPath?: string;
  children: ReactNode;
}) {
  return (
    <div className="d-doc">
      <DocsSidebar slug={slug} before={before} currentPath={currentPath} />
      <main id="main" className="d-main">
        <DocsDisclosure slug={slug} before={before} currentPath={currentPath} />
        {children}
      </main>
    </div>
  );
}
