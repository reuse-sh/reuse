"use client";
import { Avatar } from "@reuse-sh/avatars/react";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { createLightbox, type LightboxItem } from "@reuse-sh/lightbox";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import "./mechanics.css";

const photos = [
  {
    id: "lake",
    src: "https://reuse.sh/images/marble-lake.svg",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 1600,
    height: 1200,
  },
  {
    id: "mountains",
    src: "https://reuse.sh/images/marble-mountains.svg",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 1600,
    height: 1200,
  },
  {
    id: "coast",
    src: "https://reuse.sh/images/marble-coast.svg",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 1600,
    height: 1200,
  },
  {
    id: "forest",
    src: "https://reuse.sh/images/marble-forest.svg",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 1600,
    height: 1200,
  },
  {
    id: "night",
    src: "https://reuse.sh/images/marble-night.svg",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 1600,
    height: 1200,
  },
  {
    id: "woods",
    src: "https://reuse.sh/images/marble-woods.svg",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 1600,
    height: 1200,
  },
];
const [lake, mountains, coast, forest, night, woods] = photos;
const paths = {
  close: ["M18 6L6.00081 17.9992M17.9992 18L6 6.00085"],
  prev: ["m15 18-6-6 6-6"],
  next: ["m9 18 6-6-6-6"],
  zoom: [
    "M18.5016 19.1217L21 21.6217M20 15.1217C20 12.0842 17.5376 9.62173 14.5 9.62173C11.4624 9.62173 9 12.0842 9 15.1217C9 18.1593 11.4624 20.6217 14.5 20.6217C17.5376 20.6217 20 18.1593 20 15.1217Z",
    "M14.5 13.1217V17.1217M16.5 15.1217H12.5",
    "M10 3.62173H14M3 10.6217V14.6217M6.5 21.6217C4.567 21.6217 3 20.0547 3 18.1217M17.5 3.62173C19.433 3.62173 21 5.18873 21 7.12173M3 7.12173C3 5.18873 4.567 3.62173 6.5 3.62173",
  ],
};
function icon(name: keyof typeof paths) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
  }))
    svg.setAttribute(key, value);
  for (const d of paths[name]) {
    const path = document.createElementNS(svg.namespaceURI, "path");
    for (const [key, value] of Object.entries({
      d,
      stroke: "currentColor",
      "stroke-width": name === "prev" || name === "next" ? "1.8" : "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }))
      path.setAttribute(key, value);
    svg.append(path);
  }
  return svg;
}
const lightboxIcons = {
  close: () => icon("close"),
  prev: () => icon("prev"),
  next: () => icon("next"),
  zoom: () => icon("zoom"),
};
type Photo = (typeof photos)[number];

function PhotoButton({
  photo,
  className,
  hidden,
  children,
}: {
  photo: Photo;
  className?: string;
  hidden?: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      href={photo.src}
      className={cn("re-photo", className)}
      data-photo={photo.id}
      aria-label={`Open ${photo.caption}`}
      hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
    >
      {/* biome-ignore lint/performance/noImgElement: marble SVGs are served as is; the lightbox reads the rendered image as its origin. */}
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        draggable={false}
      />
      {children}
    </a>
  );
}

function PhotoLightbox({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const lightbox = createLightbox({
      thumbnails: true,
      icons: lightboxIcons,
      className: "re-lightbox-demo",
    });
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const trigger = target.closest<HTMLElement>("[data-photo]");
      if (!trigger || !node.contains(trigger)) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      const group = trigger.closest("[data-photo-group]") ?? node;
      const triggers = [...group.querySelectorAll<HTMLElement>("[data-photo]")];
      const items = triggers.map((button): LightboxItem => {
        const photo =
          photos.find((entry) => entry.id === button.dataset.photo) ??
          photos[0];
        const image = button.querySelector("img");
        return {
          src: photo.src,
          alt: photo.alt,
          caption: photo.caption,
          width: photo.width,
          height: photo.height,
          thumbnailSrc: photo.src,
          previewSrc: image?.currentSrc || photo.src,
          origin: button.hidden ? null : image,
        };
      });
      lightbox.open(items, triggers.indexOf(trigger));
    };
    node.addEventListener("click", onClick);
    return () => {
      node.removeEventListener("click", onClick);
      lightbox.destroy();
    };
  }, []);
  return (
    <div ref={root} data-gallery="" className={className}>
      {children}
    </div>
  );
}
function useHighlight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const highlight = createMovingHighlight(ref.current);
    return () => highlight.destroy();
  }, []);
  return ref;
}

const people = [
  ["Mara Lind", "Proofs from the new series, finally", "18:42"],
  ["Jonas Weber", "Invoice is in the shared folder", "16:05"],
  ["Aiko Tanaka", "See you at ten", "Thu"],
  ["Lea Novak", "Thanks, that works", "Tue"],
] as const;

function ChatList() {
  const rows = useHighlight<HTMLDivElement>();
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="re-list px-2 py-3.5 bg-secondary border-r border-border">
      <p className="re-list-title px-2 pt-0.5 pb-2.5 text-label font-semibold">
        Messages
      </p>
      <div className="re-list-rows grid gap-0.5" ref={rows}>
        {people.map(([name, text, time], index) => (
          <button
            key={name}
            type="button"
            disabled={!ready}
            className="re-person grid items-center gap-2.5 p-2 border-0 rounded-control bg-transparent text-left cursor-pointer"
            data-re-row
            data-current={index === current ? "" : undefined}
            aria-current={index === current ? "true" : undefined}
            onClick={() => setCurrent(index)}
          >
            <Avatar name={name} src={photos[index].src} size={36} />
            <span className="re-person-text grid min-w-0">
              <b>{name}</b>
              <small>{text}</small>
            </span>
            <time>{time}</time>
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadHead() {
  return (
    <div className="re-thread-head flex items-center gap-2.5 px-4 py-3 border-b border-border">
      <Avatar
        name="Mara Lind"
        src={photos[0].src}
        size={32}
        badge={{ type: "dot", label: "Online" }}
      />
      <span>
        <b>Mara Lind</b>
        <small>Active now</small>
      </span>
    </div>
  );
}
export function Example() {
  const all = [lake, coast, woods, mountains, forest, night];
  const shown = all.slice(0, 3);
  const hidden = all.slice(3);
  return (
    <div className="re-example w-full min-w-0">
      <div className="re-chat grid overflow-hidden rounded-2xl bg-card shadow-panel">
        <ChatList />
        <div className="re-thread grid-cols-1 grid min-w-0">
          <ThreadHead />
          <PhotoLightbox className="re-msgs flex flex-col gap-1.5 p-4 overflow-hidden max-sm:px-3 max-sm:py-3.5">
            <span className="re-day self-center mb-1.5">Sunday 18:42</span>
            <p className="re-msg self-start max-w-3/4 px-3 py-2 rounded-2xl rounded-bl-md bg-muted text-ui">
              Proofs from the new series, finally
            </p>
            <div
              className="re-tiles grid grid-rows-2 gap-1 w-4/5 max-w-80 aspect-landscape overflow-hidden rounded-2xl"
              data-photo-group
            >
              {shown.map((photo, index) => (
                <PhotoButton key={photo.id} photo={photo}>
                  {index === 2 ? (
                    <span className="re-more absolute inset-0 grid place-items-center bg-scrim/40 text-primary-foreground text-lg font-semibold">
                      +{hidden.length}
                    </span>
                  ) : null}
                </PhotoButton>
              ))}
              {hidden.map((photo) => (
                <PhotoButton key={photo.id} photo={photo} hidden />
              ))}
            </div>
            <p className="re-msg max-w-3/4 px-3 py-2 text-ui re-me self-end mt-1.5 rounded-2xl rounded-br-md bg-message text-message-foreground">
              The coral one is my favorite
            </p>
            <span className="re-read self-end -mt-0.5">Read 18:44</span>
            <div
              className="re-single w-3/5 max-w-56 overflow-hidden rounded-2xl"
              data-photo-group
            >
              <PhotoButton photo={night} />
            </div>
            <p className="re-msg self-start max-w-3/4 px-3 py-2 rounded-2xl rounded-bl-md bg-muted text-ui">
              And the last one, in blue and gold
            </p>
          </PhotoLightbox>
          <div className="re-compose flex items-center gap-2 mx-3 mb-3 p-1 pl-3.5 rounded-full border border-input">
            <input
              type="text"
              placeholder="Message Mara"
              aria-label="Message Mara"
            />
            <button
              disabled
              type="button"
              aria-label="Send"
              data-re-tooltip="Send"
            >
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
    </div>
  );
}
