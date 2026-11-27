"use client";
import { Masonry } from "@reuse-sh/gallery/react";
import type { LightboxSlot } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef, useState } from "react";
import { Picture } from "@/components/picture";
import { Button } from "@/components/ui/button";
import { type Photo, type PhotoGroup, photo } from "@/lib/photos";
import "./portfolio.css";

const first = [
  "white-arc",
  "blue-ridges",
  "sea-and-sky",
  "monstera",
  "pink-tower",
  "snow-walk",
  "steel-wave",
  "cloud-peak",
  "golden-calm",
  "arch-room",
  "concrete-blocks",
  "yellow-bloom",
  "white-grid",
  "beach-palm",
  "horizon",
  "garden-wall",
  "rock-edge",
  "dunes",
  "sailboat",
  "glass-tower",
  "table-still-life",
  "quiet-stair",
  "misty-forest",
  "dusk-beach",
] as const;
const more = [
  "white-court",
  "lone-pine",
  "open-sea",
  "green-sprig",
  "balconies",
  "grey-lounge",
  "fog-road",
  "blue-corner",
  "pink-summit",
  "shoreline",
  "cube-and-squash",
  "shadow-wall",
] as const;
const portfolio = [...first, ...more].map(photo);
const groups: readonly PhotoGroup[] = [
  "Architecture",
  "City",
  "Nature",
  "Sea",
  "Still life",
  "Interiors",
  "People",
];
type Filter = PhotoGroup | "All";
const filters: readonly Filter[] = [
  "All",
  ...groups.filter((group) => portfolio.some((p) => p.group === group)),
];
const shows = (filter: Filter) => (p: Photo) =>
  filter === "All" || p.group === filter;

export function Example() {
  const [loaded, setLoaded] = useState<number>(first.length);
  const [filter, setFilter] = useState<Filter>("All");
  const tiles = useRef(new Map<string, HTMLButtonElement>());
  const focusAfterLoad = useRef<string | null>(null);
  const state = useRef({ loaded, filter });
  state.current = { loaded, filter };

  const item = (p: Photo) => ({
    src: p.src,
    srcset: p.srcSet,
    alt: p.alt,
    caption: p.caption,
    width: p.width,
    height: p.height,
    origin: () => tiles.current.get(p.id) ?? null,
  });
  const loadMore = () => {
    const added = portfolio
      .slice(state.current.loaded)
      .filter(shows(state.current.filter));
    state.current.loaded = portfolio.length;
    setLoaded(portfolio.length);
    return added;
  };

  const loadMoreSlot = useRef<LightboxSlot>(({ lightbox, document }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "re-lightbox-button";
    button.textContent = "Load more";
    button.style.width = "auto";
    button.style.paddingInline = "16px";
    button.style.borderRadius = "20px";
    button.addEventListener("click", () => {
      lightbox.append(loadMore().map(item));
      button.hidden = true;
      button
        .closest("dialog")
        ?.querySelector<HTMLElement>(".re-lightbox-viewport")
        ?.focus({ preventScroll: true });
    });
    return {
      node: button,
      update: () => {
        button.hidden = state.current.loaded >= portfolio.length;
      },
    };
  });
  const viewer = useLightbox({ slots: { toolbarEnd: loadMoreSlot.current } });

  const shown = portfolio.slice(0, loaded).filter(shows(filter));
  return (
    <div className="re-portfolio flex w-full min-w-0 flex-col gap-5">
      <fieldset className="m-0 flex min-w-0 flex-wrap gap-1.5 border-0 p-0">
        <legend className="sr-only">Subject</legend>
        {filters.map((name) => (
          <label key={name} className="relative">
            <input
              type="radio"
              name="portfolio-subject"
              value={name}
              checked={filter === name}
              onChange={() => setFilter(name)}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 cursor-pointer items-center rounded-control px-3 text-label font-medium text-muted-foreground transition duration-150 ease-ui hover:bg-accent hover:text-foreground motion-reduce:transition-none peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
              {name}
            </span>
          </label>
        ))}
      </fieldset>
      <Masonry className="re-portfolio-grid w-full" aria-label="Portfolio">
        {shown.map((p, index) => (
          <button
            key={p.id}
            ref={(tile) => {
              if (!tile) return void tiles.current.delete(p.id);
              tiles.current.set(p.id, tile);
              if (focusAfterLoad.current !== p.id) return;
              focusAfterLoad.current = null;
              tile.focus();
            }}
            type="button"
            className="block cursor-zoom-in rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={`Open ${p.caption}`}
            onClick={() => viewer.open(shown.map(item), index)}
          >
            <Picture
              photo={p}
              className="block h-auto w-full rounded-control bg-media"
              sizes="(max-width: 48rem) 50vw, 220px"
              alt=""
            />
          </button>
        ))}
      </Masonry>
      {loaded < portfolio.length ? (
        <Button
          variant="secondary"
          className="self-center"
          onClick={() => {
            focusAfterLoad.current =
              portfolio.slice(loaded).find(shows(filter))?.id ?? null;
            setLoaded(portfolio.length);
          }}
        >
          Load more
        </Button>
      ) : null}
    </div>
  );
}
