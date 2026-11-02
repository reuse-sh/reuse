import type { ReactNode } from "react";
import type { Framework } from "../../lib/framework";
import { FrameworkScope } from "../../lib/framework-context";
import { DocsDisclosure, DocsSidebar } from "./nav";

export function LibraryFrame({
  slug,
  before,
  children,
  framework = "react",
}: {
  slug: string;
  before?: ReactNode;
  children: ReactNode;
  framework?: Framework;
}) {
  return (
    <FrameworkScope framework={framework}>
      <div className="d-doc">
        <DocsSidebar slug={slug} before={before} />
        <main id="main" className="d-main">
          <DocsDisclosure slug={slug} before={before} />
          {children}
        </main>
      </div>
    </FrameworkScope>
  );
}
