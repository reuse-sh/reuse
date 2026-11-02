import type { ReactNode } from "react";
import type { Framework } from "../lib/framework";
import { FrameworkScope } from "../lib/framework-context";
import { SiteFooter } from "./shell/site-footer";
import { SiteHeader } from "./shell/site-header";
import { TooltipRoot } from "./shell/tooltip-root";

export function SiteFrame({
  framework,
  children,
}: {
  framework?: Framework;
  children: ReactNode;
}) {
  const content = (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <TooltipRoot />
    </>
  );
  return framework ? (
    <FrameworkScope framework={framework}>{content}</FrameworkScope>
  ) : (
    content
  );
}
