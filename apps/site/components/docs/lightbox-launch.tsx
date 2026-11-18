"use client";

import {
  createLightbox,
  type Lightbox,
  type LightboxItem,
  type LightboxOptions,
} from "@reuse-sh/lightbox";
import { useEffect, useRef } from "react";
import { iconNode, lightboxIcons } from "../icons";
import { Card, CardContent } from "../ui/card";

export type LaunchItem = LightboxItem & {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type Make = (
  create: (options?: LightboxOptions) => Lightbox,
  icons: typeof setupIcons,
  items: () => LaunchItem[],
) => Lightbox;

const setupIcons = {
  ...lightboxIcons,
  info: () => iconNode("info", 18),
  heart: () => iconNode("heart", 18),
};

/**
 * A gallery that opens a real lightbox over the whole page. `module` is the same setup
 * source the page shows, as an ES module whose default export builds the lightbox.
 */
export function LightboxLaunch({
  items,
  module,
  css,
  scope,
}: {
  items: readonly LaunchItem[];
  module: string;
  css: string;
  scope?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const viewer = useRef<Promise<Lightbox> | null>(null);

  useEffect(
    () => () => {
      const pending = viewer.current;
      viewer.current = null;
      void pending?.then((lightbox) => lightbox.destroy());
    },
    [],
  );

  const load = () => {
    viewer.current ??= (async () => {
      const url = URL.createObjectURL(
        new Blob([module], { type: "text/javascript" }),
      );
      try {
        const { default: make }: { default: Make } = await import(
          /* webpackIgnore: true */ /* turbopackIgnore: true */ url
        );
        const create = (options?: LightboxOptions) =>
          createLightbox({
            icons: lightboxIcons,
            ...options,
            className: [options?.className, scope].filter(Boolean).join(" "),
          });
        return make(create, setupIcons, () => [...items]);
      } finally {
        URL.revokeObjectURL(url);
      }
    })();
    return viewer.current;
  };

  const open = async (index: number) => {
    const lightbox = await load();
    const tiles = root.current?.querySelectorAll<HTMLImageElement>("img");
    lightbox.open(
      items.map((item, at) => ({ ...item, origin: tiles?.[at] ?? null })),
      index,
    );
  };

  return (
    <Card>
      <style>{css}</style>
      <CardContent padding="none" className="rounded-panel">
        <div ref={root} className="grid grid-cols-2 gap-1.5 p-4 sm:grid-cols-4">
          {items.map((item, index) => (
            <a
              key={item.src}
              href={item.src}
              className="relative block aspect-4/3 cursor-zoom-in overflow-hidden rounded-control bg-media"
              onClick={(event) => {
                if (
                  event.defaultPrevented ||
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                void open(index);
              }}
            >
              {/* biome-ignore lint/performance/noImgElement: marble SVGs are served as is; the lightbox reads the rendered image as its origin. */}
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
