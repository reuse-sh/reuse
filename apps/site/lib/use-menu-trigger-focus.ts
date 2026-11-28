import { type MouseEvent, useEffect, useState } from "react";

export function useMenuTriggerFocus() {
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    if (!quiet) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") setQuiet(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [quiet]);

  return {
    "data-re-focus-quiet": quiet ? "" : undefined,
    onBlur: () => setQuiet(false),
    onClick: (event: MouseEvent) => setQuiet(event.detail > 0),
  };
}
