import type { Library } from "@reuse-sh/catalog";
import Link from "next/link";
import { snippets } from "../../lib/guides";
import { photos } from "../../lib/photos";
import { CodeBlock } from "../shell/code-block";
import { exampleCode } from "./example-code";
import { ChatList, ProductOptions, ThreadHead } from "./lightbox-islands";
import {
  C,
  CodePair,
  ExampleCode,
  Features,
  Install,
  Keys,
  OverviewActions,
  Section,
  Text,
} from "./parts";
import { PhotoButton, PhotoLightbox } from "./photos";

const [lake, mountains, coast, forest, night, woods] = photos;

export function LightboxOverview({ library }: { library: Library }) {
  return (
    <>
      <OverviewActions library={library} />
      <PhotoLightbox className="d-gal">
        {[lake, mountains, coast, forest, night].map((photo, index) => (
          <PhotoButton
            key={photo.id}
            photo={photo}
            className={index === 0 ? "d-gal-main" : undefined}
          />
        ))}
      </PhotoLightbox>
      <Keys>
        Click a photo, then <kbd>←</kbd>
        <kbd>→</kbd> to page, <kbd>+</kbd>
        <kbd>−</kbd> to zoom, <kbd>Esc</kbd> to close.
      </Keys>
      <Features
        rows={library.features}
        icons={["resize", "touch", "zoom", "keyboard", "layers", "code"]}
      />
    </>
  );
}

export function LightboxStart({ library }: { library: Library }) {
  const code = snippets.lightbox;
  return (
    <>
      <Section title="Install">
        <Text>Lightbox brings Carousel with it for paging.</Text>
        <Install library={library} />
      </Section>
      <Section title="Bind a gallery">
        <Text>
          Every image inside the element opens in the viewer, in page order.
          With React, the hook opens the same viewer from your own buttons.
        </Text>
        <CodePair js={code.native} react={code.react} />
      </Section>
      <Section title="Clean up">
        <Text>
          <C>destroy()</C> removes the listeners and restores every style it
          changed, so the viewer can come and go with a route. The React hook
          does this when the component unmounts.
        </Text>
      </Section>
    </>
  );
}

export function LightboxProduct() {
  const [js, react] = exampleCode.product;
  return (
    <>
      <div className="x-product">
        <PhotoLightbox className="x-shots">
          <div data-photo-group>
            <PhotoButton photo={lake} className="x-shot-main" />
            <div className="x-thumbs">
              {[mountains, woods, coast].map((photo) => (
                <PhotoButton key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        </PhotoLightbox>
        <div className="x-info">
          <p className="x-crumb">
            Prints <span>/</span> Landscapes
          </p>
          <h2 className="x-title">Braies cabin print</h2>
          <ProductOptions />
          <p className="x-note">
            Ships flat between two boards in 3 to 5 days.
          </p>
        </div>
      </div>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function LightboxChat() {
  const [js, react] = exampleCode.chat;
  const all = [lake, coast, woods, mountains, forest, night];
  const shown = all.slice(0, 3);
  const hidden = all.slice(3);
  return (
    <>
      <div className="x-chat">
        <ChatList />
        <div className="x-thread">
          <ThreadHead />
          <PhotoLightbox className="x-msgs">
            <span className="x-day">Sunday 18:42</span>
            <p className="x-msg">Photos from the weekend, finally</p>
            <div className="x-tiles" data-photo-group>
              {shown.map((photo, index) => (
                <PhotoButton key={photo.id} photo={photo}>
                  {index === 2 ? (
                    <span className="x-more">+{hidden.length}</span>
                  ) : null}
                </PhotoButton>
              ))}
              {hidden.map((photo) => (
                <PhotoButton key={photo.id} photo={photo} hidden />
              ))}
            </div>
            <p className="x-msg x-me">The cabin one is unreal</p>
            <span className="x-read">Read 18:44</span>
            <div className="x-single" data-photo-group>
              <PhotoButton photo={night} />
            </div>
            <p className="x-msg">And the last night, from the ridge</p>
          </PhotoLightbox>
          <div className="x-compose">
            <input
              type="text"
              placeholder="Message Mara"
              aria-label="Message Mara"
            />
            <button type="button" aria-label="Send" data-reuse-tooltip="Send">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 19V5m0 0-6 6m6-6 6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <ExampleCode js={js} react={react} />
    </>
  );
}

export function LightboxJournal() {
  const [js, react] = exampleCode.journal;
  const [hero, a, b, c, d] = [mountains, forest, night, woods, lake];
  return (
    <>
      <PhotoLightbox>
        <article className="x-journal" data-photo-group>
          <p className="x-date">October 2026 · 5 photographs</p>
          <h2 className="x-j-title">Three days above the tree line</h2>
          <p className="x-j-text">
            We left the car at the last switchback before sunrise and climbed
            through the pines until the trail turned to granite. By noon the
            forest was below us.
          </p>
          <figure className="x-j-fig">
            <PhotoButton photo={hero} className="x-j-hero" />
            <figcaption>{hero.caption}</figcaption>
          </figure>
          <div className="x-j-pair">
            <PhotoButton photo={a} />
            <PhotoButton photo={b} />
          </div>
          <p className="x-j-text">
            The second night was clear enough to read the ridge by starlight. On
            the last morning the lake held the whole ridge without a ripple, and
            we stayed until the light went flat.
          </p>
          <div className="x-j-wide">
            <PhotoButton photo={c} />
            <PhotoButton photo={d} />
          </div>
        </article>
      </PhotoLightbox>
      <ExampleCode js={js} react={react} />
    </>
  );
}

const plannedItem = `// Planned. Not in the current release, and the shape may change.
lightbox.open([
  {
    type: "video",
    src: "/clips/lake.mp4",
    poster: "/photos/lake-800.webp",
    width: 1920,
    height: 1080,
    caption: "Morning on the lake",
  },
]);`;

const media = [
  [
    "Images",
    "Supported",
    "Any format the browser decodes. Pass a preview source to open instantly and a larger one to zoom into.",
  ],
  [
    "Video files",
    "Planned",
    "MP4 and WebM with a poster frame, paused when you page away.",
  ],
  [
    "YouTube and Vimeo",
    "Planned",
    "Embedded players that load only when their page is shown.",
  ],
  [
    "Iframes",
    "Planned",
    "Any page you trust, such as a map or a 3D view, inside a slide.",
  ],
] as const;

export function LightboxMedia() {
  return (
    <>
      <ul className="d-status">
        {media.map(([name, state, text]) => (
          <li key={name}>
            <span className="d-status-name">{name}</span>
            <span className="c-badge" data-state={state.toLowerCase()}>
              {state}
            </span>
            <p>{text}</p>
          </li>
        ))}
      </ul>
      <Section title="Today">
        <Text>
          Pass image items: <C>src</C>, <C>alt</C>, an optional <C>caption</C>,
          a smaller <C>previewSrc</C> and the natural size. The{" "}
          <Link className="c-link" href="/lightbox/api">
            API page
          </Link>{" "}
          lists every method.
        </Text>
      </Section>
      <Section
        title={
          <>
            Planned item shape{" "}
            <span className="c-badge" data-state="planned">
              Planned
            </span>
          </>
        }
      >
        <Text>
          A sketch of what a video item may look like. It does not work in the
          current release.
        </Text>
        <div className="d-planned">
          <CodeBlock tabs={{ label: "JavaScript", code: plannedItem }} />
        </div>
      </Section>
    </>
  );
}
