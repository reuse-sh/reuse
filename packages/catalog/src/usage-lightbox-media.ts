import type { UsageRecipe } from "./usage-types.js";

const packageStyles = (id: string) => ({
  title: "Package styles",
  blocks: [
    {
      kind: "prose" as const,
      text: "Import the package stylesheets once in your main CSS: base.css holds the layout and theme.css the default theme. The components layer lets Tailwind utilities adapt their presentation.",
    },
    {
      kind: "code" as const,
      id: `lightbox-examples-${id}-package-styles`,
      language: "css" as const,
      code: `@import "@reuse-sh/lightbox/base.css" layer(components);
@import "@reuse-sh/lightbox/theme.css" layer(components);`,
      role: "setup" as const,
    },
  ],
});

const styles = (id: string) => ({
  title: "Styles",
  blocks: [
    {
      kind: "prose" as const,
      text: "Import the package stylesheets once: base.css holds the layout and theme.css the default theme. Keep application layout styles scoped to this integration.",
    },
    {
      kind: "code" as const,
      id: `lightbox-examples-${id}-css`,
      language: "css" as const,
      code: `@import "@reuse-sh/lightbox/base.css";
@import "@reuse-sh/lightbox/theme.css";`,
      role: "usage" as const,
    },
  ],
});

const cleanup = (id: string) => ({
  title: "Cleanup",
  blocks: [
    {
      kind: "prose" as const,
      text: "Run this when the view is removed, before mounting another controller on the same element.",
    },
    {
      kind: "code" as const,
      id: `lightbox-examples-${id}-cleanup`,
      language: "javascript" as const,
      code: `unbind();
lightbox.destroy();`,
      role: "cleanup" as const,
    },
  ],
});

const shapesUsage =
  "Give each link the full file and each image its real size and its srcset in data-lightbox-width, data-lightbox-height and data-lightbox-srcset. The viewer reads the shape from them: a photo more than twice as high as wide, and more than two screens tall at the screen's width, opens at that width with its top edge in view, and a photo more than three times as wide as high opens whole. A zoom goes as far as the widest file's own pixels, and an SVG, which has none, zooms up to four times its fitted size.";

const shapesIntegration =
  "The tall screenshot scrolls with a vertical drag, the wheel, ArrowUp and ArrowDown, and the zoom button shows it whole, while ArrowLeft and ArrowRight still page. A file that can carry transparency, such as a PNG or an SVG, gets the theme's backing color behind it, only under the image. Links still open the file without JavaScript. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile.";

const shapesMarkup = `<div id="shapes">
  <a href="/photos/page-1280.jpg"><img src="/photos/page-640.jpg" alt="A full-page screenshot" width="640" height="2011" data-lightbox-width="2560" data-lightbox-height="8045" data-lightbox-srcset="/photos/page-640.jpg 640w, /photos/page-1280.jpg 1280w, /photos/page-2560.jpg 2560w" /></a>
  <a href="/photos/horizon-1280.jpg"><img src="/photos/horizon-640.jpg" alt="A wide band of sea at sunset" width="640" height="150" data-lightbox-width="2560" data-lightbox-height="600" data-lightbox-srcset="/photos/horizon-640.jpg 640w, /photos/horizon-1280.jpg 1280w, /photos/horizon-2560.jpg 2560w" /></a>
  <a href="/photos/logo-1280.png"><img src="/photos/logo-640.png" alt="A logo on a transparent background" width="640" height="640" data-lightbox-width="2560" data-lightbox-height="2560" data-lightbox-srcset="/photos/logo-640.png 640w, /photos/logo-1280.png 1280w, /photos/logo-2560.png 2560w" /></a>
  <a href="/photos/hills.svg"><img src="/photos/hills.svg" alt="A drawing of hills" width="1500" height="1000" /></a>
</div>`;

const mixedUsage =
  "Pass the video and embed modules in the content option, then mark each link that is not a photo with data-lightbox-type. A video link points at the file and an embed link at the YouTube or Vimeo page; the image inside the link is the poster that flies open. Photos keep their plain links, and the whole set pages as one sequence.";

const mixedIntegration =
  "Only the slide on screen plays. When a click opened the viewer, a player starts the first time its slide shows, muted if the browser refuses sound, and leaving the slide pauses it. Over a player the pointer belongs to the player, so paging works from the arrows, the thumbnails and the 24px beside it. The YouTube player comes from youtube-nocookie.com in a sandboxed frame, and while it cannot load, the other slides page, play and close as before. Links still open the file or the video page without JavaScript.";

export const lightboxMediaUsage: Readonly<Record<string, UsageRecipe>> = {
  "lightbox/examples/tall-and-wide": {
    react: [
      packageStyles("tall-and-wide"),
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: shapesUsage },
          {
            kind: "code",
            id: "lightbox-examples-tall-and-wide-react",
            language: "tsx",
            code: `"use client";

import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useRef } from "react";

const files = (name: string, type = "jpg") =>
  [640, 1280, 2560].map((width) => \`/photos/\${name}-\${width}.\${type} \${width}w\`).join(", ");

export function Shapes() {
  const gallery = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({});
  useEffect(() => {
    if (gallery.current) return bindLightboxGallery(gallery.current, lightbox);
  }, [lightbox]);
  return (
    <div ref={gallery}>
      <a href="/photos/page-1280.jpg">
        <img src="/photos/page-640.jpg" alt="A full-page screenshot" width="640" height="2011"
          data-lightbox-width="2560" data-lightbox-height="8045" data-lightbox-srcset={files("page")} />
      </a>
      <a href="/photos/horizon-1280.jpg">
        <img src="/photos/horizon-640.jpg" alt="A wide band of sea at sunset" width="640" height="150"
          data-lightbox-width="2560" data-lightbox-height="600" data-lightbox-srcset={files("horizon")} />
      </a>
      <a href="/photos/logo-1280.png">
        <img src="/photos/logo-640.png" alt="A logo on a transparent background" width="640" height="640"
          data-lightbox-width="2560" data-lightbox-height="2560" data-lightbox-srcset={files("logo", "png")} />
      </a>
      <a href="/photos/hills.svg">
        <img src="/photos/hills.svg" alt="A drawing of hills" width="1500" height="1000" />
      </a>
    </div>
  );
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: `${shapesIntegration} The React hook closes its viewer at once and frees it on unmount or when Activity hides it, and opens the same viewer again when Activity shows it.`,
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: shapesUsage },
          {
            kind: "code",
            id: "lightbox-examples-tall-and-wide-markup",
            language: "html",
            code: shapesMarkup,
            role: "usage",
          },
        ],
      },
      styles("tall-and-wide"),
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the lightbox and the unbind function for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-examples-tall-and-wide-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery, createLightbox } from "@reuse-sh/lightbox";

const lightbox = createLightbox();
const unbind = bindLightboxGallery(document.querySelector("#shapes"), lightbox);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: shapesIntegration }],
      },
      cleanup("tall-and-wide"),
    ],
  },
  "lightbox/examples/mixed-media": {
    react: [
      packageStyles("mixed-media"),
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: mixedUsage },
          {
            kind: "code",
            id: "lightbox-examples-mixed-media-react",
            language: "tsx",
            code: `"use client";

import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { embed } from "@reuse-sh/lightbox/embed";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { video } from "@reuse-sh/lightbox/video";
import { useEffect, useRef } from "react";

const content = [video(), embed()];

export function Media() {
  const gallery = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({ content, thumbnails: "bottom" });
  useEffect(() => {
    if (gallery.current) return bindLightboxGallery(gallery.current, lightbox);
  }, [lightbox]);
  return (
    <div ref={gallery}>
      <a href="/photos/coast.jpg"><img src="/photos/coast-small.jpg" alt="A rocky coast" width="320" height="240" /></a>
      <a href="/videos/pan.mp4" data-lightbox-type="video">
        <img src="/videos/pan.jpg" alt="A slow pan along the sea" width="320" height="180" />
      </a>
      <a href="https://www.youtube.com/watch?v=VIDEO_ID" data-lightbox-type="embed">
        <img src="/videos/waves.jpg" alt="Waves seen from above" width="320" height="180" />
      </a>
    </div>
  );
}`,
            role: "usage",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: `${mixedIntegration} Keep the content list outside the component, so a render passes the same modules. The React hook closes its viewer at once and frees it on unmount or when Activity hides it, and opens the same viewer again when Activity shows it.`,
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          { kind: "prose", text: mixedUsage },
          {
            kind: "code",
            id: "lightbox-examples-mixed-media-markup",
            language: "html",
            code: `<div id="media">
  <a href="/photos/coast.jpg"><img src="/photos/coast-small.jpg" alt="A rocky coast" width="320" height="240" /></a>
  <a href="/videos/pan.mp4" data-lightbox-type="video">
    <img src="/videos/pan.jpg" alt="A slow pan along the sea" width="320" height="180" />
  </a>
  <a href="https://www.youtube.com/watch?v=VIDEO_ID" data-lightbox-type="embed">
    <img src="/videos/waves.jpg" alt="Waves seen from above" width="320" height="180" />
  </a>
</div>`,
            role: "usage",
          },
        ],
      },
      styles("mixed-media"),
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the lightbox and the unbind function for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-examples-mixed-media-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery, createLightbox } from "@reuse-sh/lightbox";
import { embed } from "@reuse-sh/lightbox/embed";
import { video } from "@reuse-sh/lightbox/video";

const lightbox = createLightbox({ content: [video(), embed()], thumbnails: "bottom" });
const unbind = bindLightboxGallery(document.querySelector("#media"), lightbox);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [{ kind: "prose", text: mixedIntegration }],
      },
      cleanup("mixed-media"),
    ],
  },
};
