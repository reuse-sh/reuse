import type { UsageRecipe } from "./usage-types.js";

export const mediaUsage: Readonly<Record<string, UsageRecipe>> = {
  "lightbox/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep a real image link as the trigger, then open its full-size image through useLightbox. The origin image gives the opening and closing transition its actual crop.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function Gallery() {
  const lightbox = useLightbox({});
  return (
    <a href="/images/print-large.jpg" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open([{
        src: event.currentTarget.href,
        alt: "Marble print",
        origin: event.currentTarget.querySelector("img"),
      }]);
    }}>
      <img src="/images/print.jpg" alt="Marble print" width="640" height="480" />
    </a>
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
            text: "Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element. The React hook destroys its viewer on unmount.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Keep a real image link as the trigger, then enhance the gallery with bindLightboxGallery. The origin image gives the opening and closing transition its actual crop.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-markup",
            language: "html",
            code: `<div id="gallery">
  <a href="/images/print-large.jpg">
    <img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Marble print" width="640" height="480" />
  </a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), {});`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "lightbox-getting-started-cleanup",
            language: "javascript",
            code: "gallery.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "lightbox/examples/product": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-package-styles",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use one item list for the product hero and its detail images. Open the clicked index and enable thumbnails so people can inspect each view without leaving the viewer.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function ProductGallery() {
  const lightbox = useLightbox({ thumbnails: true });
  const items = [
    { src: "/images/print-large.jpg", thumbnailSrc: "/images/print.jpg", alt: "Whole print" },
    { src: "/images/detail-large.jpg", thumbnailSrc: "/images/detail.jpg", alt: "Paper detail" },
  ];
  return <div className="flex gap-4">{items.map((item, index) => (
    <a key={item.src} href={item.src} onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open(items.map((entry, position) => ({
        ...entry,
        origin: position === index ? event.currentTarget.querySelector("img") : null,
      })), index);
    }}>
      <img src={item.thumbnailSrc} alt={item.alt} width="320" height="240" />
    </a>
  ))}</div>;
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
            text: "The small item list describes the two actual product assets. Keep image dimensions and alt text with each asset. Native gallery binding collects images in DOM order. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element. The React hook destroys its viewer on unmount.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use one item list for the product hero and its detail images. Open the clicked index and enable thumbnails so people can inspect each view without leaving the viewer.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-markup",
            language: "html",
            code: `<div id="gallery">
  <a href="/images/print-large.jpg"><img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Whole print" width="320" height="240" /></a>
  <a href="/images/detail-large.jpg"><img data-lightbox-src="/images/detail-large.jpg" src="/images/detail.jpg" alt="Paper detail" width="320" height="240" /></a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-css",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), { thumbnails: true });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The small item list describes the two actual product assets. Keep image dimensions and alt text with each asset. Native gallery binding collects images in DOM order. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "lightbox-examples-product-cleanup",
            language: "javascript",
            code: "gallery.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "lightbox/examples/chat": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-package-styles",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Bind each message separately so next and previous stay inside the selected attachment group. One hook instance per message gives React the same boundary.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function MessageAttachments({ sources }: { sources: string[] }) {
  const lightbox = useLightbox();
  return <div className="flex gap-2">{sources.map((src, index) => (
    <a key={src} href={src} onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open(sources.map((source) => ({ src: source, alt: "Message attachment" })), index);
    }}>
      <img src={src} alt="Message attachment" width="160" height="120" />
    </a>
  ))}</div>;
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
            text: "Mount the message component for every message rather than passing every conversation attachment to a global viewer. Destroy the binding when a message is removed. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element. The React hook destroys its viewer on unmount.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Bind each message separately so next and previous stay inside the selected attachment group. Keep one gallery binding per message.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-markup",
            language: "html",
            code: `<article>
  <p>Here is the print proof.</p>
  <div data-message-images>
    <a href="/images/proof.jpg"><img data-lightbox-src="/images/proof.jpg" src="/images/proof.jpg" alt="Print proof" width="160" height="120" /></a>
  </div>
</article>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-css",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery } from "@reuse-sh/lightbox";

const galleries = Array.from(document.querySelectorAll("[data-message-images]"),
  (root) => bindLightboxGallery(root));
const gallery = { destroy: () => galleries.forEach((entry) => entry.destroy()) };`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Bind each message gallery instead of passing every conversation attachment to a global viewer. Destroy the binding when a message is removed. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "lightbox-examples-chat-cleanup",
            language: "javascript",
            code: "gallery.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "lightbox/examples/journal": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-package-styles",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Bind the article image sequence and make image clicks close the viewer. Disable double-tap zoom for the same reading-oriented interaction.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function Gallery() {
  const lightbox = useLightbox({ imageClick: "close", doubleTapZoom: false });
  return (
    <a href="/images/print-large.jpg" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open([{
        src: event.currentTarget.href,
        alt: "Marble print",
        origin: event.currentTarget.querySelector("img"),
      }]);
    }}>
      <img src="/images/print.jpg" alt="Marble print" width="640" height="480" />
    </a>
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
            text: "A cropped article thumbnail does not constrain the full-size viewer image. Use descriptive captions through the image data-caption attribute, and keep nearby article text outside the gallery root if it contains unrelated images. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element. The React hook destroys its viewer on unmount.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Bind the article image sequence and make image clicks close the viewer. Disable double-tap zoom for the same reading-oriented interaction.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-markup",
            language: "html",
            code: `<div id="gallery">
  <a href="/images/print-large.jpg">
    <img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Marble print" width="640" height="480" />
  </a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-css",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery, lightboxItemFromImage } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), { imageClick: "close", doubleTapZoom: false, getItem: (image) => ({ ...lightboxItemFromImage(image), caption: image.dataset.caption }) });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "A cropped article thumbnail does not constrain the full-size viewer image. Use descriptive captions through the image data-caption attribute, and keep nearby article text outside the gallery root if it contains unrelated images. Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close restores the opening element.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "lightbox-examples-journal-cleanup",
            language: "javascript",
            code: "gallery.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "lightbox/guides/media": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-package-styles",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Lightbox currently accepts images. Keep full-size URLs, optional preview URLs and accessible descriptions in each LightboxItem. Video and iframe content need a separate player.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function ImageLink() {
  const lightbox = useLightbox();
  return <a href="/images/print-large.jpg" onClick={(event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
    lightbox.open([{
      src: event.currentTarget.href,
      previewSrc: "/images/print.jpg",
      width: 2400,
      height: 1800,
      alt: "Blue marble print",
      caption: "Archival pigment on paper",
      origin: event.currentTarget.querySelector("img"),
    }]);
  }}><img src="/images/print.jpg" alt="Blue marble print" width="640" height="480" /></a>;
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
            text: "Width and height describe the full-size asset. previewSrc can show the small image while the original loads. The viewer loads the current image and its neighbors; leave the real image URL on the link for no-JavaScript access.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Lightbox currently accepts images. Keep full-size URLs, optional preview URLs and accessible descriptions in each LightboxItem. Video and iframe content need a separate player.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-markup",
            language: "html",
            code: `<div id="gallery">
  <a href="/images/print-large.jpg">
    <img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Blue marble print" width="640" height="480" data-caption="Archival pigment on paper" data-width="2400" data-height="1800" />
  </a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-css",
            language: "css",
            code: '@import "@reuse-sh/lightbox/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery, lightboxItemFromImage } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), { getItem: (image) => ({ ...lightboxItemFromImage(image), caption: image.dataset.caption, width: Number(image.dataset.width) || undefined, height: Number(image.dataset.height) || undefined }) });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Width and height describe the full-size asset. previewSrc can show the small image while the original loads. The viewer loads the current image and its neighbors; leave the real image URL on the link for no-JavaScript access.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "lightbox-guides-media-cleanup",
            language: "javascript",
            code: "gallery.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/carousel/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The viewport scrolls and each direct child snaps. Start with ordinary links and the package classes, then add the controller for dragging and local arrow keys.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-react",
            language: "tsx",
            code: `"use client";

import { Carousel } from "@reuse-sh/carousel/react";

export function PrintGallery() {
  return <Carousel tabIndex={0} aria-label="Prints">
    <a className="re-carousel__slide basis-4/5" href="/prints/blue"><img className="w-full" src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
    <a className="re-carousel__slide basis-4/5" href="/prints/sand"><img className="w-full" src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
  </Carousel>;
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
            text: "Touch and trackpad scrolling work before scripts run. Keep tabIndex on the viewport so keyboard users can reach local arrow navigation. The React component owns initialization and teardown.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The viewport scrolls and each direct child snaps. Start with ordinary links and the package classes, then add the controller for dragging and local arrow keys.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-markup",
            language: "html",
            code: `<div id="prints" class="re-carousel" tabindex="0" aria-label="Prints">
  <a class="re-carousel__slide" href="/prints/blue"><img src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
  <a class="re-carousel__slide" href="/prints/sand"><img src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-css",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

#prints { --re-carousel-slide-width: 80%; }
#prints img { display: block; width: 100%; height: auto; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

const carousel = createCarousel(document.querySelector("#prints"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Touch and trackpad scrolling work before scripts run. Keep tabindex on the viewport so keyboard users can reach local arrow navigation.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "carousel-getting-started-cleanup",
            language: "javascript",
            code: "carousel.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/examples/product-strip": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-package-styles",
            language: "css",
            code: '@import "@reuse-sh/carousel/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use page grouping for a product shelf so each arrow advances the visible group. Derive disabled buttons from canPrev and canNext rather than calculating scroll positions yourself.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-react",
            language: "tsx",
            code: `"use client";

import { useCarousel } from "@reuse-sh/carousel/react";

export function ProductStrip() {
  const { ref, carousel, state } = useCarousel({ group: "page" });
  return <section aria-label="Related prints">
    <div className="flex justify-between gap-4">
      <h2>Related prints</h2>
      <div>
        <button type="button" disabled={!state.canPrev} onClick={() => carousel?.prev()}>Previous</button>
        <button type="button" disabled={!state.canNext} onClick={() => carousel?.next()}>Next</button>
      </div>
    </div>
    <div ref={ref} className="re-carousel" tabIndex={0}>
      <a className="re-carousel__slide basis-1/2" href="/prints/blue">Blue print</a>
      <a className="re-carousel__slide basis-1/2" href="/prints/sand">Sand print</a>
      <a className="re-carousel__slide basis-1/2" href="/prints/ink">Ink print</a>
    </div>
  </section>;
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
            text: "The cards remain links during mouse dragging and the controller suppresses accidental drag clicks. Native controls stay hidden until initialization succeeds. Reduced motion changes movement to a jump.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use page grouping for a product shelf so each arrow advances the visible group. Derive disabled buttons from canPrev and canNext rather than calculating scroll positions yourself.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-markup",
            language: "html",
            code: `<section aria-label="Related prints">
  <h2>Related prints</h2>
  <button id="previous" type="button" hidden>Previous</button>
  <button id="next" type="button" hidden>Next</button>
  <div id="prints" class="re-carousel" tabindex="0">
    <a class="re-carousel__slide" href="/prints/blue">Blue print</a>
    <a class="re-carousel__slide" href="/prints/sand">Sand print</a>
    <a class="re-carousel__slide" href="/prints/ink">Ink print</a>
  </div>
</section>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-css",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

#prints { --re-carousel-slide-width: 45%; }
#prints img { display: block; width: 100%; height: auto; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const carousel = createCarousel(document.querySelector("#prints"), { group: "page" });
const render = (state) => {
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
};
const stop = carousel.subscribe(render);
render(carousel.getState());
previous.hidden = next.hidden = false;
const prev = () => carousel.prev();
const advance = () => carousel.next();
previous.addEventListener("click", prev);
next.addEventListener("click", advance);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The cards remain links during mouse dragging and the controller suppresses accidental drag clicks. Native controls stay hidden until initialization succeeds. Reduced motion changes movement to a jump.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "carousel-examples-product-strip-cleanup",
            language: "javascript",
            code: `previous.removeEventListener("click", prev);
next.removeEventListener("click", advance);
previous.hidden = next.hidden = true;
stop();
carousel.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/examples/editorial": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-package-styles",
            language: "css",
            code: '@import "@reuse-sh/carousel/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Give editorial images most of the viewport width so the next image remains visible. Keep alignment at the start and loop off so the article has a clear beginning and end.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-react",
            language: "tsx",
            code: `"use client";

import { Carousel } from "@reuse-sh/carousel/react";

export function PrintGallery() {
  return <Carousel tabIndex={0} aria-label="Prints">
    <a className="re-carousel__slide basis-4/5" href="/prints/blue"><img className="w-full" src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
    <a className="re-carousel__slide basis-4/5" href="/prints/sand"><img className="w-full" src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
  </Carousel>;
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
            text: "Size the outer gallery from the article layout, not by measuring the carousel in JavaScript. A narrow slide remains visible through native scrolling without scripts. Arrow keys act only while focus is inside this strip.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Give editorial images most of the viewport width so the next image remains visible. Keep alignment at the start and loop off so the article has a clear beginning and end.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-markup",
            language: "html",
            code: `<div id="prints" class="re-carousel" tabindex="0" aria-label="Prints">
  <a class="re-carousel__slide" href="/prints/blue"><img src="/images/blue.jpg" alt="Blue print" width="640" height="480" /></a>
  <a class="re-carousel__slide" href="/prints/sand"><img src="/images/sand.jpg" alt="Sand print" width="640" height="480" /></a>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-css",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

#prints { --re-carousel-slide-width: 80%; }
#prints img { display: block; width: 100%; height: auto; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

const carousel = createCarousel(document.querySelector("#prints"), { align: "start", loop: false });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Size the outer gallery from the article layout, not by measuring the carousel in JavaScript. A narrow slide remains visible through native scrolling without scripts. Arrow keys act only while focus is inside this strip.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "carousel-examples-editorial-cleanup",
            language: "javascript",
            code: "carousel.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "carousel/guides/controls": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-package-styles",
            language: "css",
            code: '@import "@reuse-sh/carousel/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Controls call the carousel and read its state. The viewport owns paging, so arrows, counters and selected dots must follow state.index rather than keeping a second position.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-react",
            language: "tsx",
            code: `"use client";

import { useCarousel } from "@reuse-sh/carousel/react";

export function ControlledStrip() {
  const { ref, carousel, state } = useCarousel({ group: "page" });
  return <section aria-label="Related prints">
    <div className="flex justify-between gap-4">
      <h2>Related prints</h2>
      <div>
        <button type="button" disabled={!state.canPrev} onClick={() => carousel?.prev()}>Previous</button>
        <button type="button" disabled={!state.canNext} onClick={() => carousel?.next()}>Next</button>
      </div>
    </div>
    <div ref={ref} className="re-carousel" tabIndex={0}>
      <a className="re-carousel__slide basis-1/2" href="/prints/blue">Blue print</a>
      <a className="re-carousel__slide basis-1/2" href="/prints/sand">Sand print</a>
      <a className="re-carousel__slide basis-1/2" href="/prints/ink">Ink print</a>
    </div>
  </section>;
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
            text: "For a counter, render state.index + 1 and state.count. For dots, call carousel.goTo(index), name each button with its destination, and expose the selected one with aria-current. Subscribe once, render getState immediately, then unsubscribe before destroy.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Controls call the carousel and read its state. The viewport owns paging, so arrows, counters and selected dots must follow state.index rather than keeping a second position.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-markup",
            language: "html",
            code: `<section aria-label="Related prints">
  <h2>Related prints</h2>
  <button id="previous" type="button" hidden>Previous</button>
  <button id="next" type="button" hidden>Next</button>
  <div id="prints" class="re-carousel" tabindex="0">
    <a class="re-carousel__slide" href="/prints/blue">Blue print</a>
    <a class="re-carousel__slide" href="/prints/sand">Sand print</a>
    <a class="re-carousel__slide" href="/prints/ink">Ink print</a>
  </div>
</section>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-css",
            language: "css",
            code: `@import "@reuse-sh/carousel/styles.css";

#prints { --re-carousel-slide-width: 80%; }
#prints img { display: block; width: 100%; height: auto; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-initialize",
            language: "javascript",
            code: `import { createCarousel } from "@reuse-sh/carousel";

const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const carousel = createCarousel(document.querySelector("#prints"), { group: "page" });
const render = (state) => {
  previous.disabled = !state.canPrev;
  next.disabled = !state.canNext;
};
const stop = carousel.subscribe(render);
render(carousel.getState());
previous.hidden = next.hidden = false;
const prev = () => carousel.prev();
const advance = () => carousel.next();
previous.addEventListener("click", prev);
next.addEventListener("click", advance);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "For a counter, render state.index + 1 and state.count. For dots, call carousel.goTo(index), name each button with its destination, and expose the selected one with aria-current. Subscribe once, render getState immediately, then unsubscribe before destroy.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "carousel-guides-controls-cleanup",
            language: "javascript",
            code: `previous.removeEventListener("click", prev);
next.removeEventListener("click", advance);
previous.hidden = next.hidden = true;
stop();
carousel.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "annotations/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Pass image dimensions and a typed annotation list to AnnotatedImage. Coordinates are percentages of the image, so a mark keeps its position when the image becomes narrower.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-react",
            language: "tsx",
            code: `import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";

export function ReviewImage() {
  const annotations: Annotation[] = [
    { kind: "marker", point: [38, 46], text: "Check the paper texture." },
  ];
  return <AnnotatedImage src="/images/proof.jpg" alt="Print proof" width={1200} height={900} annotations={annotations} />;
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
            text: "The HTML list preserves the note before enhancement and the controller restores it on destroy. React renders the image and notes on the server. Give every image useful alt text; annotation labels add detail rather than replacing it.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Pass image dimensions and a typed annotation list to AnnotatedImage. Coordinates are percentages of the image, so a mark keeps its position when the image becomes narrower.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-markup",
            language: "html",
            code: `<div id="review-image">
  <img src="/images/proof.jpg" alt="Print proof" width="1200" height="900" />
  <ol data-annotations>
    <li data-kind="marker" data-point="38 46">Check the paper texture.</li>
  </ol>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-initialize",
            language: "javascript",
            code: `import { annotationsFromHtml, createAnnotatedImage } from "@reuse-sh/annotations";

const root = document.querySelector("#review-image");
const annotations = annotationsFromHtml(root);
const image = createAnnotatedImage(root, {
  src: "/images/proof.jpg", alt: "Print proof", width: 1200, height: 900, annotations,
});`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The HTML list preserves the note before enhancement and the controller restores it on destroy. React renders the image and notes on the server. Give every image useful alt text; annotation labels add detail rather than replacing it.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "annotations-getting-started-cleanup",
            language: "javascript",
            code: "image.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "annotations/examples/review-notes": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-package-styles",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Publish read-only notes through AnnotatedImage. Choose the smallest annotation shape that describes the feedback, and keep review text in the stored document.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-react",
            language: "tsx",
            code: `import type { Annotation } from "@reuse-sh/annotations";
import { AnnotatedImage } from "@reuse-sh/annotations/react";

export function ReviewImage() {
  const annotations: Annotation[] = [
    { kind: "area", box: [20, 25, 30, 20], label: "Check this crop" },
    { kind: "pointer", point: [65, 42], label: "Keep this detail", side: "auto" },
  ];
  return <AnnotatedImage src="/images/proof.jpg" alt="Print proof" width={1200} height={900} annotations={annotations} />;
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
            text: "Area boxes are left, top, width and height in percent. Pointer side auto lets labels choose available space, and narrow images use numbered notes below. Rendering adds no editing controls or writable state.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Publish read-only notes through AnnotatedImage. Choose the smallest annotation shape that describes the feedback, and keep review text in the stored document.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-markup",
            language: "html",
            code: `<div id="review-image">
  <img src="/images/proof.jpg" alt="Print proof" width="1200" height="900" />
  <ol data-annotations>
    <li data-kind="marker" data-point="38 46">Check the paper texture.</li>
  </ol>
</div>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-css",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-initialize",
            language: "javascript",
            code: `import { annotationsFromHtml, createAnnotatedImage } from "@reuse-sh/annotations";

const root = document.querySelector("#review-image");
const annotations = annotationsFromHtml(root);
const image = createAnnotatedImage(root, {
  src: "/images/proof.jpg", alt: "Print proof", width: 1200, height: 900, annotations,
});`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Area boxes are left, top, width and height in percent. Pointer side auto lets labels choose available space, and narrow images use numbered notes below. Rendering adds no editing controls or writable state.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "annotations-examples-review-notes-cleanup",
            language: "javascript",
            code: "image.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "annotations/examples/editor": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-package-styles",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The editor is controlled. Keep its annotations in application state and accept every onChange update. Saving is a separate application action, so drawing does not silently write to a server.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-react",
            language: "tsx",
            code: `"use client";

import { useState } from "react";
import type { Annotation } from "@reuse-sh/annotations";
import { serializeAnnotations } from "@reuse-sh/annotations";
import { AnnotationEditor } from "@reuse-sh/annotations/react";

export function ProofEditor() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  return <>
    <AnnotationEditor src="/images/proof.jpg" alt="Print proof" width={1200} height={900} annotations={annotations} onChange={setAnnotations} />
    <output>{serializeAnnotations(annotations)}</output>
  </>;
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
            text: "The React wrapper includes tool buttons, label editing, undo and redo. The native example adds one marker tool; use setTool for other tools. Arrow keys move a selected mark, Delete removes it, and Escape cancels. Persist serializeAnnotations output at your application save boundary.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The editor is controlled. Keep its annotations in application state and accept every onChange update. Saving is a separate application action, so drawing does not silently write to a server.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-markup",
            language: "html",
            code: `<section id="editor" aria-label="Edit proof">
  <div id="review-image"><img src="/images/proof.jpg" alt="Print proof" width="1200" height="900" /></div>
</section>
<button id="marker-tool" type="button" hidden>Add marker</button>
<output id="annotation-json"></output>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-css",
            language: "css",
            code: '@import "@reuse-sh/annotations/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-initialize",
            language: "javascript",
            code: `import { createAnnotatedImage, createAnnotationEditor, serializeAnnotations } from "@reuse-sh/annotations";

const image = createAnnotatedImage(document.querySelector("#review-image"), {
  src: "/images/proof.jpg", alt: "Print proof", width: 1200, height: 900, annotations: [],
});
const output = document.querySelector("#annotation-json");
const editor = createAnnotationEditor(document.querySelector("#editor"), {
  annotations: [],
  onChange: (annotations) => {
    image.update({ src: "/images/proof.jpg", alt: "Print proof", width: 1200, height: 900, annotations });
    output.textContent = serializeAnnotations(annotations);
  },
});
const tool = document.querySelector("#marker-tool");
const chooseMarker = () => editor.setTool("marker");
tool.addEventListener("click", chooseMarker);
tool.hidden = false;`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The React wrapper includes tool buttons, label editing, undo and redo. The native example adds one marker tool; use setTool for other tools. Arrow keys move a selected mark, Delete removes it, and Escape cancels. Persist serializeAnnotations output at your application save boundary.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "annotations-examples-editor-cleanup",
            language: "javascript",
            code: `tool.removeEventListener("click", chooseMarker);
tool.hidden = true;
editor.destroy();
image.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "annotations/guides/data-format": {
    react: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use the versioned document at storage and network boundaries. parseAnnotations rejects unsupported versions and malformed top-level input; it drops invalid marks and clamps valid coordinates to the image.",
          },
          {
            kind: "code",
            id: "annotations-format",
            language: "javascript",
            code: `import { parseAnnotations, serializeAnnotations, annotationsToHtml } from "@reuse-sh/annotations";

const annotations = parseAnnotations({
  version: 1,
  annotations: [{ kind: "marker", point: [25, 60], text: "Check <strong>contrast</strong>." }],
});
const json = serializeAnnotations(annotations);
const html = annotationsToHtml(annotations);`,
            role: "usage",
          },
        ],
      },
      {
        title: "Choose coordinates",
        blocks: [
          {
            kind: "prose",
            text: "area and spotlight use box [left, top, width, height]. arrow and line use line [x1, y1, x2, y2]. pointer and marker use point [x, y]. Pointer adds label and side; marker adds text. Every coordinate is a percentage. Marker text permits strong, em and code; other markup is escaped or removed during parsing.",
          },
        ],
      },
      {
        title: "Handle invalid input",
        blocks: [
          {
            kind: "prose",
            text: "Catch JSON syntax, shape and version errors where the document enters your application. Show an import error and keep the current document rather than overwriting it with an empty list. annotationsToHtml produces a data-annotations list; annotationsFromHtml reads that list back.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Use the versioned document at storage and network boundaries. parseAnnotations rejects unsupported versions and malformed top-level input; it drops invalid marks and clamps valid coordinates to the image.",
          },
          {
            kind: "code",
            id: "annotations-format",
            language: "javascript",
            code: `import { parseAnnotations, serializeAnnotations, annotationsToHtml } from "@reuse-sh/annotations";

const annotations = parseAnnotations({
  version: 1,
  annotations: [{ kind: "marker", point: [25, 60], text: "Check <strong>contrast</strong>." }],
});
const json = serializeAnnotations(annotations);
const html = annotationsToHtml(annotations);`,
            role: "usage",
          },
        ],
      },
      {
        title: "Choose coordinates",
        blocks: [
          {
            kind: "prose",
            text: "area and spotlight use box [left, top, width, height]. arrow and line use line [x1, y1, x2, y2]. pointer and marker use point [x, y]. Pointer adds label and side; marker adds text. Every coordinate is a percentage. Marker text permits strong, em and code; other markup is escaped or removed during parsing.",
          },
        ],
      },
      {
        title: "Handle invalid input",
        blocks: [
          {
            kind: "prose",
            text: "Catch JSON syntax, shape and version errors where the document enters your application. Show an import error and keep the current document rather than overwriting it with an empty list. annotationsToHtml produces a data-annotations list; annotationsFromHtml reads that list back.",
          },
        ],
      },
    ],
  },
  "avatars/getting-started": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-package-styles",
            language: "css",
            code: '@import "@reuse-sh/avatars/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Render a name, optional photo and meaningful badge label. The component keeps initials underneath the photo and enhances badge cutouts after mounting.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-react",
            language: "tsx",
            code: `import { Avatar } from "@reuse-sh/avatars/react";

export function Person() {
  return <Avatar name="Alex Morgan" src="/images/alex.jpg" badge={{ type: "dot", label: "Available" }} />;
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
            text: "The badge label joins the accessible name. The image has empty alt because the avatar already names the person. Initials remain if the photo fails; without JavaScript the markup still shows the person and status. The React wrapper owns cleanup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Render a name, optional photo and meaningful badge label. The component keeps initials underneath the photo and enhances badge cutouts after mounting.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-markup",
            language: "html",
            code: `<span id="person" class="re-avatar" data-re-avatar role="img" aria-label="Alex Morgan, Available">
  <span class="re-avatar-face" data-re-avatar-face aria-hidden="true">AM<img class="re-avatar-image" src="/images/alex.jpg" alt="" /></span>
  <span class="re-avatar-badge" data-re-avatar-badge="dot" aria-hidden="true"></span>
</span>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-css",
            language: "css",
            code: '@import "@reuse-sh/avatars/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-initialize",
            language: "javascript",
            code: `import { enhanceAvatar } from "@reuse-sh/avatars";

const avatar = enhanceAvatar(document.querySelector("#person"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The badge label joins the accessible name. The image has empty alt because the avatar already names the person. Initials remain if the photo fails; without JavaScript the markup still shows the person and status.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "avatars-getting-started-cleanup",
            language: "javascript",
            code: "avatar.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "avatars/examples/team": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-package-styles",
            language: "css",
            code: '@import "@reuse-sh/avatars/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put each avatar beside the visible member name. A status dot communicates availability visually and its label adds the same information to the accessible name.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-react",
            language: "tsx",
            code: `import { Avatar } from "@reuse-sh/avatars/react";

export function TeamMember() {
  return <div className="flex items-center gap-3">
    <Avatar name="Alex Morgan" src="/images/alex.jpg" badge={{ type: "dot", label: "Available" }} />
    <span>Alex Morgan</span>
  </div>;
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
            text: "Use badge labels such as Available or Away rather than relying on color. Cutouts reveal the actual surrounding background, so the row can change surface color without repainting a matching ring.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "Put each avatar beside the visible member name. A status dot communicates availability visually and its label adds the same information to the accessible name.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-markup",
            language: "html",
            code: `<span id="person" class="re-avatar" data-re-avatar role="img" aria-label="Alex Morgan, Available">
  <span class="re-avatar-face" data-re-avatar-face aria-hidden="true">AM<img class="re-avatar-image" src="/images/alex.jpg" alt="" /></span>
  <span class="re-avatar-badge" data-re-avatar-badge="dot" aria-hidden="true"></span>
</span>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-css",
            language: "css",
            code: `@import "@reuse-sh/avatars/styles.css";

#person { --re-avatar-status-color: #288c5d; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-initialize",
            language: "javascript",
            code: `import { enhanceAvatar } from "@reuse-sh/avatars";

const avatar = enhanceAvatar(document.querySelector("#person"));`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Use badge labels such as Available or Away rather than relying on color. Cutouts reveal the actual surrounding background, so the row can change surface color without repainting a matching ring.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "avatars-examples-team-cleanup",
            language: "javascript",
            code: "avatar.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "avatars/examples/stack": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-package-styles",
            language: "css",
            code: '@import "@reuse-sh/avatars/styles.css" layer(components);',
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "AvatarGroup overlaps real avatar elements and cuts each visible edge around the next avatar. End the group with a named count badge when additional people are omitted.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-react",
            language: "tsx",
            code: `import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";

export function Participants() {
  return <AvatarGroup overlap={12} clearance={2} aria-label="Project participants">
    <Avatar name="Alex Morgan" src="/images/alex.jpg" />
    <Avatar name="Sam Lee" badge={{ type: "count", count: 12, label: "12 more participants" }} />
  </AvatarGroup>;
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
            text: "The group enhances its avatars, including badges. Multi-digit counts receive a measured capsule cutout. Keep full participant names available in the surrounding application rather than hiding essential information in a hover-only popup.",
          },
        ],
      },
    ],
    html: [
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "createAvatarGroup overlaps real avatar elements and cuts each visible edge around the next avatar. End the group with a named count badge when additional people are omitted.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-markup",
            language: "html",
            code: `<span id="participants" class="re-avatar-group" aria-label="Project participants">
  <span class="re-avatar" data-re-avatar role="img" aria-label="Alex Morgan"><span class="re-avatar-face" data-re-avatar-face aria-hidden="true">AM</span></span>
  <span class="re-avatar" data-re-avatar role="img" aria-label="Sam Lee, 12 more participants"><span class="re-avatar-face" data-re-avatar-face aria-hidden="true">SL</span><span class="re-avatar-badge" data-re-avatar-badge="count" aria-hidden="true">12</span></span>
</span>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheet once. Keep application layout styles scoped to this integration.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-css",
            language: "css",
            code: '@import "@reuse-sh/avatars/styles.css";',
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. Keep the returned controller for the lifetime of this content.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-initialize",
            language: "javascript",
            code: `import { createAvatarGroup } from "@reuse-sh/avatars";

const group = createAvatarGroup(document.querySelector("#participants"), { overlap: 12, clearance: 2 });`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "The group enhances its avatars, including badges. Multi-digit counts receive a measured capsule cutout. Keep full participant names available in the surrounding application rather than hiding essential information in a hover-only popup.",
          },
        ],
      },
      {
        title: "Cleanup",
        blocks: [
          {
            kind: "prose",
            text: "Run this when the view is removed, before mounting another controller on the same element.",
          },
          {
            kind: "code",
            id: "avatars-examples-stack-cleanup",
            language: "javascript",
            code: "group.destroy();",
            role: "cleanup",
          },
        ],
      },
    ],
  },
};
