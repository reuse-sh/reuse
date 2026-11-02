import type { ReactNode } from "react";
import { DocsDisclosure, DocsSidebar } from "./nav";

export function LibraryFrame({
  slug,
  before,
  children,
}: {
  slug: string;
  before?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="d-doc">
      <DocsSidebar slug={slug} before={before} />
      <main id="main" className="d-main">
        <DocsDisclosure slug={slug} before={before} />
        {children}
      </main>
    </div>
  );
}
