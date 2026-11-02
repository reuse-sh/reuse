import type { Library } from "@reuse-sh/catalog";
import type { ReactNode } from "react";
import { Keys, OverviewActions, Principles } from "./parts";
export function TooltipOverview({
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
        Move along the toolbar, or press <kbd>Tab</kbd> to reach it and{" "}
        <kbd>Esc</kbd> to hide the hint.
      </Keys>

      <Principles
        rows={library.principles}
        icons={["layers", "cursor", "keyboard", "touch", "doc", "resize"]}
      />
    </>
  );
}
