"use client";

import { type ReactNode, useEffect, useRef } from "react";

const wakeEvery = 800;
const inputs = ["pointermove", "pointerdown", "keydown"] as const;

// Focusing the viewer's close button inside the frame can steal focus from the embedding page.
function returnFocus(outer: Element | null | undefined) {
  // The frame and the reader's element belong to the embedding page's realm, so instanceof
  // against this document's classes is false for them.
  const frame = window.frameElement as HTMLElement | null;
  if (!frame || outer === frame) return;
  if (frame.ownerDocument.activeElement !== frame) return;
  if (document.activeElement instanceof HTMLElement)
    document.activeElement.blur();
  if (outer && outer !== frame.ownerDocument.body && "focus" in outer)
    (outer as HTMLElement).focus({ preventScroll: true });
  else frame.blur();
}

/**
 * With ?open, opens the first photo of the gallery inside it and keeps the controls shown until
 * the reader's own pointer or key reaches the page, so a framed viewer shows its controls at rest.
 */
export function LightboxLookOpen({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("open")) return;
    let wake: ReturnType<typeof setInterval> | undefined;
    let touched = false;
    let pressed = false;
    const stop = (event: Event) => {
      if (!event.isTrusted) return;
      touched = true;
      pressed ||= event.type !== "pointermove";
      clearInterval(wake);
    };
    const frame = window.frameElement;
    const page = frame?.ownerDocument;
    let outer = page?.activeElement;
    const follow = (event: Event) => {
      if (event.target !== frame) outer = event.target as Element;
    };
    page?.addEventListener("focusin", follow);
    const opened = new MutationObserver(() => {
      if (!document.querySelector("dialog[open]")) return;
      opened.disconnect();
      if (!pressed) returnFocus(outer);
      if (touched) return;
      // The lightbox reads autoHide once per open, so until the reader moves the frame stands in
      // a mouse that keeps moving. A live autoHide in setOptions would let this go.
      wake = setInterval(() => {
        document.querySelector("dialog[open]")?.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            pointerType: "mouse",
            clientX: 1,
            clientY: 1,
          }),
        );
      }, wakeEvery);
    });
    opened.observe(document.body, {
      subtree: true,
      childList: true,
      attributeFilter: ["open"],
    });
    root.current?.querySelector("a")?.click();
    for (const type of inputs)
      window.addEventListener(type, stop, { capture: true });
    return () => {
      page?.removeEventListener("focusin", follow);
      opened.disconnect();
      clearInterval(wake);
      for (const type of inputs)
        window.removeEventListener(type, stop, { capture: true });
    };
  }, []);
  return <div ref={root}>{children}</div>;
}
