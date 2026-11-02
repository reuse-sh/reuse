import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { Keys, OverviewActions, Principles } from "./parts";
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
      <Keys>
        Drag with a mouse, swipe, or focus the strip and use <kbd>←</kbd>
        <kbd>→</kbd>. Images open in the lightbox.
      </Keys>

      <Principles
        rows={library.principles}
        icons={["touch", "cursor", "chevrons", "timer", "keyboard", "code"]}
      />
    </>
  );
}
