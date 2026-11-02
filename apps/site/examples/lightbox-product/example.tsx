"use client";
import { createMovingHighlight } from "@reuse-sh/interactions";
import { createLightbox, type LightboxItem } from "@reuse-sh/lightbox";
import { type ReactNode, useEffect, useRef, useState } from "react";
import "@reuse-sh/avatars/styles.css";
import "@reuse-sh/interactions/styles.css";
import "@reuse-sh/lightbox/styles.css";
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
const [lake, mountains, coast, , , woods] = photos;
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
      className={className ? `re-photo ${className}` : "re-photo"}
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
function createSegmentHighlights(root: HTMLElement) {
  const selected = createMovingHighlight(root, {
    selectedSelector: "[data-current]",
    mode: "selected",
    className: "re-seg-fill",
  });
  const hover = createMovingHighlight(root, {
    selectedSelector: "[data-re-none]",
    mode: "hover",
    className: "re-seg-hover",
  });
  return () => {
    hover.destroy();
    selected.destroy();
  };
}

const sizes = [
  ["30 × 20", "$62"],
  ["40 × 30", "$84"],
  ["60 × 45", "$126"],
] as const;

function ProductOptions() {
  const [size, setSize] = useState(1);
  const [added, setAdded] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!group.current) return;
    return createSegmentHighlights(group.current);
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const [label, cost] = sizes[size];
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <p className="re-price [display:flex] [flex-wrap:wrap] [align-items:baseline] [gap:4px_10px] [margin-top:8px] [font-size:18px] [line-height:26px] [font-variant-numeric:tabular-nums]">
        <span>{cost}</span>
        <span className="re-meta [font-size:13px] [color:var(--re-demo-mute)]">
          Archival paper · {label} cm
        </span>
      </p>
      <p className="re-desc [margin-top:16px] [font-size:14px] [line-height:22px] [color:var(--re-demo-prose)]">
        Coral, sand and blue drift across the sheet like ink on water. Printed
        to order on matte cotton paper with a 2 cm border.
      </p>
      <fieldset className="re-field [min-width:0] [margin:22px_0_0] [padding:0] [border:0]">
        <legend className="re-label [margin-bottom:8px] [padding:0] [font-size:12.5px] [font-weight:500] [color:var(--re-demo-ink-2)]">
          Size
        </legend>
        <div
          ref={group}
          className="re-sizes [--re-highlight-radius:8px] [display:flex] [gap:2px] [padding:3px] [border-radius:11px] [background:rgb(0_0_0_/_4%)]"
        >
          {sizes.map(([name], index) => (
            <label
              key={name}
              data-re-row
              data-current={index === size ? "" : undefined}
            >
              <input
                type="radio"
                name="x-size"
                className="sr-only"
                checked={index === size}
                onChange={() => setSize(index)}
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        disabled={!ready}
        className="re-buy [height:42px] [margin-top:22px] [border:0] [border-radius:11px] [background:var(--re-demo-ink)] [color:#fff] [font-size:14px] [font-weight:520] [cursor:pointer] [transition:transform_160ms_var(--re-demo-ease),_background-color_200ms_ease]"
        data-done={added ? "" : undefined}
        onClick={() => {
          setAdded(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setAdded(false), 1600);
        }}
      >
        {added ? "Added to bag" : "Add to bag"}
      </button>
    </>
  );
}

export function Example() {
  return (
    <div className="re-example w-full min-w-0">
      <div className="re-product [display:grid] [grid-template-columns:minmax(0,_1.08fr)_minmax(0,_1fr)] [gap:36px]">
        <PhotoLightbox className="re-shots">
          <div data-photo-group>
            <PhotoButton
              photo={lake}
              className="re-shot-main [width:100%] [aspect-ratio:4_/_5]"
            />
            <div className="re-thumbs [display:grid] [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:6px] [margin-top:6px]">
              {[mountains, woods, coast].map((photo) => (
                <PhotoButton key={photo.id} photo={photo} />
              ))}
            </div>
          </div>
        </PhotoLightbox>
        <div className="re-info [display:flex] [flex-direction:column] [padding-top:6px]">
          <p className="re-crumb [font-size:12.5px] [color:var(--re-demo-mute)]">
            Prints <span>/</span> Marble
          </p>
          <h2 className="re-title [margin-top:8px] [font-size:24px] [line-height:30px] [font-weight:600] [letter-spacing:-0.025em]">
            {lake.caption} print
          </h2>
          <ProductOptions />
          <p className="re-note [margin-top:10px] [font-size:12.5px] [color:var(--re-demo-mute)] [text-align:center]">
            Ships flat between two boards in 3 to 5 days.
          </p>
        </div>
      </div>
    </div>
  );
}
