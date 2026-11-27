import type { UsageRecipe } from "./usage-types.js";

export const lightboxGalleryUsage: Readonly<Record<string, UsageRecipe>> = {
  "lightbox/examples/portfolio": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheets once in your main CSS: the gallery's styles.css lays out the masonry grid, and the lightbox's base.css and theme.css hold the viewer's layout and default theme. The components layer lets Tailwind utilities adapt their presentation.",
          },
          {
            kind: "code",
            id: "lightbox-examples-portfolio-package-styles",
            language: "css",
            code: `@import "@reuse-sh/gallery/styles.css" layer(components);
@import "@reuse-sh/lightbox/base.css" layer(components);
@import "@reuse-sh/lightbox/theme.css" layer(components);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: "The grid renders the loaded photos of the chosen subject in a Masonry, and a click opens exactly those photos in grid order, so the filter decides what the viewer pages through. The filter is a group of native radio buttons. Load more loads the next page of the whole portfolio. The page's own button sits behind the modal viewer, so a toolbarEnd slot puts a second Load more inside it: it renders the next page into the grid and passes the photos of the chosen subject to lightbox.append, which adds them at the end without moving the current photo. Both buttons go once nothing is left.",
          },
          {
            kind: "code",
            id: "lightbox-examples-portfolio-react",
            language: "tsx",
            code: `"use client";

import { Masonry } from "@reuse-sh/gallery/react";
import type { LightboxSlot } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef, useState } from "react";

type Photo = { src: string; alt: string; subject: string; width: number; height: number };
const pageSize = 12;

export function Portfolio({ photos, subjects }: { photos: Photo[]; subjects: string[] }) {
  const [subject, setSubject] = useState("All");
  const [loaded, setLoaded] = useState(24);
  const tiles = useRef(new Map<string, HTMLElement>());
  const latest = useRef({ subject, loaded });
  latest.current = { subject, loaded };
  const matches = (photo: Photo) => latest.current.subject === "All" || photo.subject === latest.current.subject;
  const item = (photo: Photo) => ({ ...photo, origin: () => tiles.current.get(photo.src) ?? null });
  const loadMore = () => {
    const from = latest.current.loaded;
    latest.current.loaded = from + pageSize;
    setLoaded(from + pageSize);
    return photos.slice(from, from + pageSize).filter(matches).map(item);
  };
  const loadMoreButton = useRef<LightboxSlot>(({ lightbox, document }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "re-lightbox-button";
    button.textContent = "Load more";
    button.style.width = "auto";
    button.style.paddingInline = "16px";
    button.style.borderRadius = "20px";
    button.addEventListener("click", () => {
      lightbox.append(loadMore());
      if (button.hidden) button.closest("dialog")?.querySelector<HTMLElement>(".re-lightbox-viewport")?.focus();
    });
    return { node: button, update: () => { button.hidden = latest.current.loaded >= photos.length; } };
  });
  const lightbox = useLightbox({ slots: { toolbarEnd: loadMoreButton.current } });
  const shown = photos.slice(0, loaded).filter(matches);
  return <div>
    <fieldset>
      <legend>Subject</legend>
      {["All", ...subjects].map((name) => (
        <label key={name}>
          <input type="radio" name="subject" checked={subject === name} onChange={() => setSubject(name)} />
          {name}
        </label>
      ))}
    </fieldset>
    <Masonry className="[--re-masonry-columns:4] max-md:[--re-masonry-columns:2]">
      {shown.map((photo, index) => (
        <button key={photo.src} type="button" aria-label={\`Open \${photo.alt}\`}
          ref={(tile) => { if (tile) tiles.current.set(photo.src, tile); else tiles.current.delete(photo.src); }}
          onClick={() => lightbox.open(shown.map(item), index)}>
          <img className="block h-auto w-full" src={photo.src} alt="" width={photo.width} height={photo.height} />
        </button>
      ))}
    </Masonry>
    {loaded < photos.length ? <button type="button" onClick={loadMore}>Load more</button> : null}
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
            text: "Each item's origin is a function that looks its tile up when the viewer needs it, so a photo appended while the viewer is open closes into the tile React rendered for it. The slot reads the loaded count from a ref, since its update runs between React renders, and hides itself once the last page is in. When the button that had focus goes, focus moves to the viewer's viewport, where the arrow keys page on to the new photos. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile. The React hook closes its viewer at once and frees it on unmount.",
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
            text: "Each photo is a link to its file with its subject in data-subject. The next page waits in a template, and a native radio group filters the grid.",
          },
          {
            kind: "code",
            id: "lightbox-examples-portfolio-markup",
            language: "html",
            code: `<form id="subjects">
  <label><input type="radio" name="subject" value="all" checked /> All</label>
  <label><input type="radio" name="subject" value="sea" /> Sea</label>
  <label><input type="radio" name="subject" value="city" /> City</label>
</form>
<div id="portfolio" class="re-masonry">
  <a href="/photos/coast.jpg" data-subject="sea"><img src="/photos/coast.jpg" alt="Waves on a pale beach" width="1600" height="1067" /></a>
  <a href="/photos/tower.jpg" data-subject="city"><img src="/photos/tower.jpg" alt="A glass tower against a blue sky" width="1200" height="1600" /></a>
  <a href="/photos/harbor.jpg" data-subject="sea"><img src="/photos/harbor.jpg" alt="Boats in a quiet harbor" width="1600" height="1600" /></a>
</div>
<template id="next-page">
  <a href="/photos/pier.jpg" data-subject="sea"><img src="/photos/pier.jpg" alt="A wooden pier at dusk" width="1600" height="900" loading="lazy" /></a>
  <a href="/photos/roofs.jpg" data-subject="city"><img src="/photos/roofs.jpg" alt="Red roofs under a pale sky" width="1200" height="1500" loading="lazy" /></a>
</template>
<button id="load-more" type="button">Load more</button>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheets once: the gallery's styles.css lays out the grid, and the lightbox's base.css and theme.css hold the viewer's layout and default theme.",
          },
          {
            kind: "code",
            id: "lightbox-examples-portfolio-css",
            language: "css",
            code: `@import "@reuse-sh/gallery/styles.css";
@import "@reuse-sh/lightbox/base.css";
@import "@reuse-sh/lightbox/theme.css";

#portfolio { --re-masonry-columns: 4; --re-masonry-gap: 8px; }
@media (max-width: 768px) { #portfolio { --re-masonry-columns: 2; } }
#portfolio img { display: block; width: 100%; height: auto; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: "Run this after the markup exists. The filter hides the links of other subjects, and the group option puts hidden links in a group of their own, so a click opens only the photos the grid shows. Load more moves the next page into the grid, and the toolbarEnd slot does the same from inside the open viewer and appends the new photos that match the filter.",
          },
          {
            kind: "code",
            id: "lightbox-examples-portfolio-initialize",
            language: "javascript",
            code: `import { createMasonry } from "@reuse-sh/gallery";
import { bindLightboxGallery, createLightbox, lightboxItemFromElement } from "@reuse-sh/lightbox";

const grid = document.querySelector("#portfolio");
const subjects = document.querySelector("#subjects");
const nextPage = document.querySelector("#next-page");
const pageButton = document.querySelector("#load-more");
const masonry = createMasonry(grid);
let left = true;

const filter = () => {
  const subject = subjects.elements.subject.value;
  for (const link of grid.querySelectorAll("a")) link.hidden = subject !== "all" && link.dataset.subject !== subject;
};
const loadMore = () => {
  if (!left) return [];
  left = false;
  const links = [...nextPage.content.cloneNode(true).children];
  grid.append(...links);
  filter();
  pageButton.hidden = true;
  return links.filter((link) => !link.hidden).map(lightboxItemFromElement);
};

const lightbox = createLightbox({
  slots: {
    toolbarEnd: ({ lightbox, document }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "re-lightbox-button";
      button.textContent = "Load more";
      button.style.width = "auto";
      button.style.paddingInline = "16px";
      button.style.borderRadius = "20px";
      button.addEventListener("click", () => {
        lightbox.append(loadMore());
        button.closest("dialog").querySelector(".re-lightbox-viewport").focus();
      });
      return { node: button, update: () => { button.hidden = !left; } };
    },
  },
});
const unbind = bindLightboxGallery(grid, lightbox, { group: (link) => (link.hidden ? "hidden" : "shown") });
subjects.addEventListener("change", filter);
pageButton.addEventListener("click", loadMore);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Integration",
        blocks: [
          {
            kind: "prose",
            text: "Links still open the photo without JavaScript. bindLightboxGallery reads the links at each click, so photos added by Load more and links hidden by the filter need no new binding. The masonry places the grid again when links come or a filter hides some. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's link.",
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
            id: "lightbox-examples-portfolio-cleanup",
            language: "javascript",
            code: `subjects.removeEventListener("change", filter);
pageButton.removeEventListener("click", loadMore);
unbind();
lightbox.destroy();
masonry.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
  "lightbox/examples/contact-sheet": {
    react: [
      {
        title: "Package styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheets once in your main CSS: base.css holds the layout and theme.css the default theme. The components layer lets Tailwind utilities adapt their presentation.",
          },
          {
            kind: "code",
            id: "lightbox-examples-contact-sheet-package-styles",
            language: "css",
            code: `@import "@reuse-sh/lightbox/base.css" layer(components);
@import "@reuse-sh/lightbox/theme.css" layer(components);`,
            role: "setup",
          },
        ],
      },
      {
        title: "Usage",
        blocks: [
          {
            kind: "prose",
            text: 'Every frame is a numbered button in a dense grid, and every frame opens in one viewer. thumbnails: "side" keeps a column of thumbnails at the viewer\'s end edge, so a click on a far thumbnail, End or a frame near the end of the sheet goes straight there, and the photos between never show. controls: { slideshow: true } adds the slideshow button, which moves to the next frame every 4 seconds. Each thumbnail loads the small file in thumbnailSrc.',
          },
          {
            kind: "code",
            id: "lightbox-examples-contact-sheet-react",
            language: "tsx",
            code: `"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";

type Frame = { src: string; thumbnail: string; alt: string; title: string };

export function ContactSheet({ frames }: { frames: Frame[] }) {
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const lightbox = useLightbox({ thumbnails: "side", controls: { slideshow: true } });
  const items = frames.map((frame, index) => ({
    src: frame.src,
    alt: frame.alt,
    caption: \`Frame \${index + 1}, \${frame.title}\`,
    thumbnailSrc: frame.thumbnail,
    origin: () => tiles.current[index] ?? null,
  }));
  return <ol className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-1.5">
    {frames.map((frame, index) => (
      <li key={frame.src}>
        <button type="button" aria-label={\`Open frame \${index + 1}, \${frame.title}\`}
          ref={(tile) => { tiles.current[index] = tile; }}
          onClick={() => lightbox.open(items, index)}>
          <img className="aspect-square w-full object-cover" src={frame.thumbnail} alt="" loading="lazy" />
        </button>
        <span aria-hidden="true">{index + 1}</span>
      </li>
    ))}
  </ol>;
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
            text: "Below 720px of width the side column becomes the bottom strip. The column is one Tab stop: arrow keys, Home and End page the viewer, and the slideshow waits while the pointer rests on the controls or the tab is hidden. Every frame has an empty slide and only the photos near the current one load, so paging costs the same with sixty frames as with six. Close returns focus to the current frame's button. The React hook closes its viewer at once and frees it on unmount.",
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
            text: "Each frame is a link to its file around a small image, with its number and title in data-lightbox-caption.",
          },
          {
            kind: "code",
            id: "lightbox-examples-contact-sheet-markup",
            language: "html",
            code: `<ol id="sheet">
  <li>
    <a href="/photos/harbor.jpg" data-lightbox-caption="Frame 1, Harbor"><img src="/photos/harbor-small.jpg" alt="Boats in a quiet harbor" loading="lazy" /></a>
    <span aria-hidden="true">1</span>
  </li>
  <li>
    <a href="/photos/pier.jpg" data-lightbox-caption="Frame 2, Pier"><img src="/photos/pier-small.jpg" alt="A wooden pier at dusk" loading="lazy" /></a>
    <span aria-hidden="true">2</span>
  </li>
  <li>
    <a href="/photos/roofs.jpg" data-lightbox-caption="Frame 3, Roofs"><img src="/photos/roofs-small.jpg" alt="Red roofs under a pale sky" loading="lazy" /></a>
    <span aria-hidden="true">3</span>
  </li>
</ol>`,
            role: "usage",
          },
        ],
      },
      {
        title: "Styles",
        blocks: [
          {
            kind: "prose",
            text: "Import the package stylesheets once: base.css holds the layout and theme.css the default theme. The sheet is a grid of square crops.",
          },
          {
            kind: "code",
            id: "lightbox-examples-contact-sheet-css",
            language: "css",
            code: `@import "@reuse-sh/lightbox/base.css";
@import "@reuse-sh/lightbox/theme.css";

#sheet { display: grid; grid-template-columns: repeat(auto-fill, minmax(4rem, 1fr)); gap: 6px; padding: 0; list-style: none; }
#sheet img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }`,
            role: "usage",
          },
        ],
      },
      {
        title: "Initialize",
        blocks: [
          {
            kind: "prose",
            text: 'Run this after the markup exists. thumbnails: "side" puts the thumbnails in a column at the end edge, and the slideshow control starts and stops the slideshow. Each thumbnail shows the small image the link holds.',
          },
          {
            kind: "code",
            id: "lightbox-examples-contact-sheet-initialize",
            language: "javascript",
            code: `import { bindLightboxGallery, createLightbox, lightboxItemFromElement } from "@reuse-sh/lightbox";

const sheet = document.querySelector("#sheet");
const lightbox = createLightbox({ thumbnails: "side", controls: { slideshow: true } });
const unbind = bindLightboxGallery(sheet, lightbox, {
  item: (link) => {
    const item = lightboxItemFromElement(link);
    return item && { ...item, thumbnailSrc: link.querySelector("img").src };
  },
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
            text: "Links still open the photo without JavaScript. Below 720px of width the side column becomes the bottom strip. The column is one Tab stop whose arrow keys, Home and End page the viewer, and only the photos near the current one load. Close returns focus to the current frame's link.",
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
            id: "lightbox-examples-contact-sheet-cleanup",
            language: "javascript",
            code: `unbind();
lightbox.destroy();`,
            role: "cleanup",
          },
        ],
      },
    ],
  },
};
