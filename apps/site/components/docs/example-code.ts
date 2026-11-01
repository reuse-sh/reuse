/* Code shown under each example, as [JavaScript, React]. */

export const exampleCode: Record<string, readonly [string, string]> = {
  product: [
    `import { bindLightboxGallery } from "@reuse-sh/lightbox";
import "@reuse-sh/lightbox/styles.css";

// The main photo and the thumbnails open as one set.
const photos = document.querySelector(".product-photos");
const lightbox = bindLightboxGallery(photos, { thumbnails: true });`,
    `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";

export function ProductPhotos({ photos }) {
  const lightbox = useLightbox({ thumbnails: true });
  const root = useRef(null);
  const open = (index) => {
    const images = root.current.querySelectorAll("img");
    lightbox.open(photos.map((photo, i) => ({ ...photo, origin: images[i] })), index);
  };
  return (
    <div ref={root} className="product-photos">
      {photos.map((photo, index) => (
        <button key={photo.src} onClick={() => open(index)}>
          <img src={photo.src} alt={photo.alt} />
        </button>
      ))}
    </div>
  );
}`,
  ],
  chat: [
    `import { bindLightboxGallery } from "@reuse-sh/lightbox";

// Each message is its own gallery, so paging stays inside it.
// Photos behind the "+3" tile stay in the markup, hidden.
for (const message of document.querySelectorAll(".message-photos")) {
  bindLightboxGallery(message, { thumbnails: false });
}`,
    `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";

export function MessagePhotos({ photos }) {
  const lightbox = useLightbox();
  const root = useRef(null);
  const shown = photos.slice(0, 3);
  const open = (index) => {
    const images = root.current.querySelectorAll("img");
    lightbox.open(photos.map((photo, i) => ({ ...photo, origin: images[i] })), index);
  };
  return (
    <div ref={root} className="message-photos">
      {shown.map((photo, index) => (
        <button key={photo.src} onClick={() => open(index)}>
          <img src={photo.src} alt={photo.alt} />
          {index === 2 && photos.length > 3 && <span>+{photos.length - 3}</span>}
        </button>
      ))}
    </div>
  );
}`,
  ],
  journal: [
    `import { bindLightboxGallery } from "@reuse-sh/lightbox";

// One sequence for the whole article, in reading order.
const article = document.querySelector("article.journal");
bindLightboxGallery(article, { thumbnails: true, imageClick: "zoom" });`,
    `import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";

export function Journal({ photos, children }) {
  const lightbox = useLightbox({ thumbnails: true, imageClick: "zoom" });
  const root = useRef(null);
  const open = (index) => {
    const images = root.current.querySelectorAll("img");
    lightbox.open(photos.map((photo, i) => ({ ...photo, origin: images[i] })), index);
  };
  return <article ref={root} className="journal">{children(open)}</article>;
}`,
  ],
  strip: [
    `import { createCarousel } from "@reuse-sh/carousel";

const strip = document.querySelector(".related .re-carousel");
const carousel = createCarousel(strip, { group: "page" });

prevButton.onclick = () => carousel.prev();
nextButton.onclick = () => carousel.next();
const render = (state) => {
  prevButton.disabled = !state.canPrev;
  nextButton.disabled = !state.canNext;
};
carousel.subscribe(render);
render(carousel.getState());`,
    `import { useCarousel } from "@reuse-sh/carousel/react";

export function Related({ prints }) {
  const { ref, carousel, state } = useCarousel({ group: "page" });
  return (
    <section className="related">
      <button disabled={!state.canPrev} onClick={() => carousel?.prev()}>Previous</button>
      <button disabled={!state.canNext} onClick={() => carousel?.next()}>Next</button>
      <div ref={ref} className="re-carousel">
        {prints.map((print) => <PrintCard key={print.id} print={print} data-carousel-slide />)}
      </div>
    </section>
  );
}`,
  ],
  editorial: [
    `import { createCarousel } from "@reuse-sh/carousel";

// The strip starts at the text column and runs off the page.
// Set padding-inline and scroll-padding-inline to the column offset.
const story = document.querySelector(".story .re-carousel");
const carousel = createCarousel(story, { loop: true });`,
    `import { Carousel } from "@reuse-sh/carousel/react";

export function Story({ photos }) {
  return (
    <Carousel className="story-strip" options={{ loop: true }}>
      {photos.map((photo) => (
        <figure key={photo.src} data-carousel-slide>
          <img src={photo.src} alt={photo.alt} />
          <figcaption>{photo.caption}</figcaption>
        </figure>
      ))}
    </Carousel>
  );
}`,
  ],
};
export const tooltipCode: Record<string, readonly [string, string]> = {
  shortcuts: [
    `import { createFloatingTooltip } from "@reuse-sh/interactions";

// The hint comes from a template next to the button.
// <button aria-label="Duplicate" data-re-tooltip-template="tip-duplicate">…</button>
// <template id="tip-duplicate">Duplicate <kbd>⌘D</kbd></template>
createFloatingTooltip(document.querySelector(".editor-toolbar"), { tilt: 5 });`,
    `import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function EditorToolbar() {
  return (
    <FloatingTooltipGroup className="editor-toolbar" tilt={5}>
      <button aria-label="Duplicate" data-re-tooltip-template="tip-duplicate"><LayersIcon /></button>
      <template
        id="tip-duplicate"
        dangerouslySetInnerHTML={{ __html: "Duplicate <kbd>⌘D</kbd>" }}
      />
    </FloatingTooltipGroup>
  );
}`,
  ],
  links: [
    `import { createFloatingTooltip } from "@reuse-sh/interactions";

// Each link names the print it points to. The card is built on hover.
createFloatingTooltip(document.querySelector("article"), {
  selector: "a[data-preview]",
  content: (link) => previewCard(prints[link.dataset.preview]),
});`,
    `import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function Article({ children }) {
  return (
    <FloatingTooltipGroup
      selector="a[data-preview]"
      content={(link) => previewCard(prints[link.dataset.preview])}
    >
      <article>{children}</article>
    </FloatingTooltipGroup>
  );
}`,
  ],
  people: [
    `import { createFloatingTooltip } from "@reuse-sh/interactions";

createFloatingTooltip(document.querySelector(".thread"), {
  selector: "[data-person]",
  content: (name) => personCard(people[name.dataset.person]),
});`,
    `import { FloatingTooltipGroup } from "@reuse-sh/interactions/react";

export function Thread({ comments }) {
  return (
    <FloatingTooltipGroup
      selector="[data-person]"
      content={(name) => personCard(people[name.dataset.person])}
    >
      {comments.map((comment) => <Comment key={comment.id} {...comment} />)}
    </FloatingTooltipGroup>
  );
}`,
  ],
};
