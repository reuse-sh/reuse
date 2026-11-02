import type { ReactNode } from "react";
import { containerVariants } from "@/components/ui/container";
import { cn } from "@/lib/utils";
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
    <div data-slot="docs-layout">
      <DocsSidebar slug={slug} before={before} />
      <main
        id="main"
        className={cn(containerVariants({ size: "docs" }), "pt-7 wide:pt-16")}
      >
        <DocsDisclosure slug={slug} before={before} />
        {children}
      </main>
    </div>
  );
}
