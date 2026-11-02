"use client";

import { useEffect, useRef } from "react";

export function NativeFrame({ id }: { id: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    let observer: ResizeObserver | undefined;
    const mediaCleanups: (() => void)[] = [];
    const clearMedia = () => {
      for (const cleanup of mediaCleanups.splice(0)) cleanup();
    };
    const recipePath = `/examples/${id}/`;
    const adaptMedia = (sheet: CSSStyleSheet) => {
      if (!sheet.href) return;
      const path = new URL(sheet.href).pathname;
      if (
        !path.startsWith(recipePath) &&
        path !== "/modules/shadows/styles.css"
      )
        return;
      const walk = (rules: CSSRuleList) => {
        for (const rule of rules) {
          if (rule.type === CSSRule.IMPORT_RULE) {
            const imported = (rule as CSSImportRule).styleSheet;
            if (imported) adaptMedia(imported);
          } else if (rule.type === CSSRule.MEDIA_RULE) {
            const media = rule as CSSMediaRule;
            if (/\b(?:width|height)\b/.test(media.conditionText)) {
              const condition = media.conditionText;
              const query = window.matchMedia(condition);
              const apply = () => {
                media.media.mediaText = query.matches ? "all" : "not all";
              };
              query.addEventListener("change", apply);
              mediaCleanups.push(() => {
                query.removeEventListener("change", apply);
                media.media.mediaText = condition;
              });
              apply();
            }
            walk(media.cssRules);
          } else if ("cssRules" in rule) {
            walk((rule as CSSGroupingRule).cssRules);
          }
        }
      };
      walk(sheet.cssRules);
    };
    const measure = () => {
      const document = element.contentDocument;
      const body = document?.body;
      document?.documentElement.style.setProperty(
        "--re-example-viewport-width",
        `${window.innerWidth}px`,
      );
      if (body)
        element.style.height = `${Math.ceil(body.getBoundingClientRect().height)}px`;
    };
    const loaded = () => {
      observer?.disconnect();
      clearMedia();
      const document = element.contentDocument;
      if (!document?.body) return;
      for (const sheet of document.styleSheets) adaptMedia(sheet);
      observer = new ResizeObserver(measure);
      observer.observe(document.body);
      measure();
    };
    element.addEventListener("load", loaded);
    window.addEventListener("resize", measure);
    if (element.contentDocument?.readyState === "complete") loaded();
    return () => {
      observer?.disconnect();
      clearMedia();
      element.removeEventListener("load", loaded);
      window.removeEventListener("resize", measure);
    };
  }, [id]);
  return (
    <iframe
      ref={frame}
      title="HTML and JavaScript example"
      src={`/examples/${id}/index.html`}
      className="block h-80 w-full border-0"
    />
  );
}
