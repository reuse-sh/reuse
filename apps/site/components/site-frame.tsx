import type { ReactNode } from "react";
import type { Framework } from "../lib/framework";
import { FrameworkScope } from "../lib/framework-context";
import { SiteFooter } from "./shell/site-footer";
import { SiteHeader } from "./shell/site-header";
import { TooltipRoot } from "./shell/tooltip-root";

export function SiteFrame({
  framework,
  layout,
  children,
}: {
  framework?: Framework;
  layout?: "content" | "docs";
  children: ReactNode;
}) {
  const content = (
    <>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter layout={layout} />
      </div>
      <TooltipRoot />
    </>
  );
  return framework ? (
    <FrameworkScope framework={framework}>{content}</FrameworkScope>
  ) : (
    content
  );
}
