"use client";

import { createFloatingTooltip } from "@reuse-sh/interactions";
import { useEffect } from "react";

export function TooltipRoot() {
  useEffect(() => {
    const tooltip = createFloatingTooltip(document.body, {
      selector: "[data-reuse-tooltip], [data-reuse-tooltip-template]",
      side: "bottom-right",
      sideOffset: 10,
      tilt: 5,
      className: "f-tip",
    });
    return () => tooltip.destroy();
  }, []);
  return null;
}
