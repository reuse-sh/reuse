import type { Library } from "@reuse-sh/catalog";
import { snippets } from "../../lib/guides";
import { photos } from "../../lib/photos";
import { CarouselControls } from "./carousel-controls";
import { exampleCode } from "./example-code";
import {
  C,
  CodePair,
  ExampleCode,
  Install,
  Keys,
  OverviewActions,
  Principles,
  Section,
  Stage,
  Text,
} from "./parts";
import { type Photo, PhotoButton, PhotoLightbox } from "./photos";
import { Arrows, CarouselMount, Dots } from "./strip";

const [lake, mountains, coast, forest, night, woods] = photos;

function Strip({
  slides,
  className,
  slideClass,
  counter = false,
}: {
  slides: Photo[];
  className: string;
  slideClass: string;
  counter?: boolean;
}) {
  return (
    <PhotoLightbox className={`d-strip ${className}`}>
      <CarouselMount>
        <section
          className="re-carousel"
          data-viewport
          data-photo-group
          aria-label="Photos"
        >
          {slides.map((photo) => (
            <figure
              key={photo.id}
              className={`re-carousel__slide ${slideClass}`}
              data-carousel-slide
            >
              <PhotoButton photo={photo} />
              <figcaption>{photo.caption}</figcaption>
            </figure>
          ))}
        </section>
        <div className="d-strip-ctrl">
          <Dots labels={slides.map((photo) => photo.caption)} />
          {counter ? (
            <span className="d-counter" data-counter>
              01 / {String(slides.length).padStart(2, "0")}
            </span>
          ) : null}
          <Arrows />
        </div>
      </CarouselMount>
    </PhotoLightbox>
  );
}

export function CarouselOverview({ library }: { library: Library }) {
  return (
    <>
      <OverviewActions library={library} />
      <Stage>
        <Strip
          slides={[mountains, night, lake, woods, forest, coast]}
          className="d-strip-demo"
          slideClass="d-slide"
        />
      </Stage>
      <Keys>
        Drag with a mouse, swipe, or focus the strip and use <kbd>←</kbd>
        <kbd>→</kbd>. Images open in the lightbox.
      </Keys>
      <Principles
        rows={library.principles}
        icons={["touch", "cursor", "chevrons", "timer", "keyboard", "code"]}
      />
    </>
  );
}

export function CarouselStart({ library }: { library: Library }) {
  const code = snippets.carousel;
  return (
    <>
      <Section title="Install">
        <Install library={library} />
      </Section>
      <Section title="Bind a strip">
        <Text>
          The viewport gets the <C>re-carousel</C> class. Slides are its
          children, or anything marked with <C>data-carousel-slide</C>. Links
          and buttons inside them keep working.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
      <Section title="Style it">
        <Text>
          Set <C>--re-carousel-slide-width</C> and <C>--re-carousel-gap</C> on
          the viewport. Arrows, dots and counters are your own markup, driven by
          the state you subscribe to.
        </Text>
      </Section>
    </>
  );
}

const prints = [
  [lake, "$84"],
  [mountains, "$72"],
  [night, "$96"],
  [forest, "$64"],
  [woods, "$88"],
  [coast, "$72"],
] as const;

export function CarouselProductStrip() {
  const [js, react] = exampleCode.strip;
  return (
    <>
      <Stage>
        <section className="x-related" aria-labelledby="x-related-h">
          <CarouselMount options={{ loop: false, group: "page" }}>
            <div className="x-related-head">
              <h2 id="x-related-h">More from the series</h2>
              <Arrows ring label="prints" />
            </div>
            <section className="re-carousel" data-viewport aria-label="Prints">
              {prints.map(([photo, price]) => (
                <a
                  key={photo.id}
                  className="re-carousel__slide x-print"
                  href="#x-related-h"
                  data-carousel-slide
                >
                  <span className="x-print-img">
                    {/* biome-ignore lint/performance/noImgElement: a static SVG texture inside a dragged slide. */}
                    <img
                      className="x-print-photo"
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.width}
                      height={photo.height}
                      loading="lazy"
                      draggable={false}
                    />
                  </span>
                  <span className="x-print-name">{photo.caption}</span>
                  <span className="x-print-price">From {price}</span>
                </a>
              ))}
            </section>
          </CarouselMount>
        </section>
      </Stage>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function CarouselEditorial() {
  const [js, react] = exampleCode.editorial;
  return (
    <>
      <Stage>
        <article className="x-story">
          <p className="x-date">Print series · October 2026</p>
          <h2 className="x-j-title">Six sheets from one tray</h2>
          <p className="x-j-text">
            The series started with one tray of water and six colors. These are
            the sheets we kept, in the order they were pulled.
          </p>
        </article>
        <Strip
          slides={[night, mountains, lake, forest, woods, coast]}
          className="d-strip-story"
          slideClass="x-story-slide"
          counter
        />
      </Stage>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function CarouselControlsGuide() {
  return <CarouselControls />;
}
