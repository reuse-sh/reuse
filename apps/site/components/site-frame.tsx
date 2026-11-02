import type { ReactNode } from "react";
import type { Framework } from "../lib/framework";
import { FrameworkScope } from "../lib/framework-context";
import { SiteFooter } from "./shell/site-footer";
import { SiteHeader } from "./shell/site-header";
import { TooltipRoot } from "./shell/tooltip-root";

export function SiteFrame({
  framework = "react",
  children,
}: {
  framework?: Framework;
  children: ReactNode;
}) {
  return (
    <FrameworkScope framework={framework}>
      <SiteHeader />
      {children}
      <SiteFooter />
      <TooltipRoot />
    </FrameworkScope>
  );
}
