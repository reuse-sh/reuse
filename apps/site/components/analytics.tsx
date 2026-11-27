"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/** Counts visits to pages in the top window, so a page framed by another one adds no visit. */
export function Analytics() {
  const [top, setTop] = useState(false);
  useEffect(() => setTop(window.top === window), []);
  if (!top) return null;
  return (
    <>
      <Script
        src="https://cdn.visitors.now/v.js"
        data-token="f3601f34-d199-43d4-839b-276c7f22650c"
        data-persist
        strategy="afterInteractive"
      />
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="6f4fda54-25e2-4b29-adab-cb9bbbfd51fb"
        strategy="afterInteractive"
      />
    </>
  );
}
