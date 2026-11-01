import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { LibrarySidebar } from "./navigation";
export function LibraryShell({
  library,
  children,
}: {
  library: Library;
  children: ReactNode;
}) {
  return (
    <div className="library-shell">
      <LibrarySidebar library={library} />
      <main id="main" className="library-content">
        {children}
      </main>
    </div>
  );
}
