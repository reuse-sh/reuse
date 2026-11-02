import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { OverviewActions, Principles } from "./parts";
export function CarouselOverview({
  library,
  example,
}: {
  library: Library;
  example?: ReactNode;
}) {
  return (
    <>
      <OverviewActions library={library} />
      {example}

      <Principles
        rows={library.principles}
        icons={["touch", "cursor", "chevrons", "timer", "keyboard", "code"]}
      />
    </>
  );
}
