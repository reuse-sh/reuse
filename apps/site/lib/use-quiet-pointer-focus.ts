import { useEffect, useState } from "react";

export function useQuietPointerFocus() {
  const [quiet, setQuiet] = useState(false);
  useEffect(() => {
    if (!quiet) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") setQuiet(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [quiet]);

  return [quiet ? "" : undefined, setQuiet] as const;
}
