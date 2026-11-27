"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useRef } from "react";
import { siteLightbox } from "@/components/site-lightbox";
import { galleryPhotos } from "@/lib/photos";
import { cn } from "@/lib/utils";

type Photo = (typeof galleryPhotos)[number];
type Message = {
  id: string;
  from: string | null;
  text?: string;
  photos?: readonly Photo[];
};

const [coast, ...rest] = galleryPhotos;
const album = rest.slice(0, 7);
const shore = rest[8];
const thread: readonly Message[] = [
  {
    id: "cliff",
    from: "Ines",
    text: "The view from the cliff this morning",
    photos: [coast],
  },
  {
    id: "roll",
    from: "Tomas",
    text: "And the whole roll from the beach",
    photos: album,
  },
  { id: "reply", from: null, text: "The third one should be a print" },
  { id: "shore", from: null, photos: [shore] },
];
const shown = 4;

const sequence = thread.flatMap((message) => message.photos ?? []);
const items = sequence.map((photo) => ({
  src: photo.src,
  srcset: photo.srcSet,
  alt: photo.alt,
  caption: photo.caption,
  width: photo.width,
  height: photo.height,
  thumbnailSrc: photo.src,
}));

export function Example() {
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const viewer = useLightbox({ ...siteLightbox, thumbnails: "bottom" });
  const opened = items.map((item, index) => ({
    ...item,
    origin: () => tiles.current[index] ?? null,
  }));
  let first = 0;
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl bg-card p-4 shadow-panel max-sm:px-3">
      {thread.map((message, at) => {
        const start = first;
        first += message.photos?.length ?? 0;
        const mine = message.from === null;
        const photos = message.photos ?? [];
        const grid = photos.length > 1;
        const tile = (photo: Photo, k: number) => {
          const index = start + k;
          const hidden = grid ? photos.length - shown : 0;
          const more = grid && k === shown - 1 && hidden > 0;
          return (
            <button
              key={photo.id}
              ref={(button) => {
                const end = k === shown - 1 ? photos.length : k + 1;
                for (let n = k; n < end; n++) tiles.current[start + n] = button;
              }}
              type="button"
              className={cn(
                "relative block overflow-hidden bg-media cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                grid ? "aspect-square" : "w-full",
              )}
              style={
                grid ? undefined : { aspectRatio: photo.width / photo.height }
              }
              aria-label={
                more
                  ? `Open ${photo.caption} and ${hidden} more`
                  : `Open ${photo.caption}`
              }
              onClick={() => viewer.open(opened, index)}
            >
              {/* biome-ignore lint/performance/noImgElement: standalone examples use native images. */}
              <img
                className="h-full w-full object-cover"
                src={photo.src}
                srcSet={photo.srcSet}
                sizes="(max-width: 48rem) 50vw, 300px"
                alt=""
                width={photo.width}
                height={photo.height}
                draggable={false}
              />
              {more ? (
                <span className="absolute inset-0 grid place-items-center bg-scrim/50 text-lg font-semibold text-primary-foreground">
                  +{hidden}
                </span>
              ) : null}
            </button>
          );
        };
        return (
          <div
            key={message.id}
            className={cn(
              "flex max-w-4/5 flex-col gap-1",
              mine ? "items-end self-end" : "items-start self-start",
              at > 0 && thread[at - 1].from !== message.from && "mt-2",
            )}
          >
            {message.from && thread[at - 1]?.from !== message.from ? (
              <span className="px-3 text-caption text-subtle-foreground">
                {message.from}
              </span>
            ) : null}
            {photos.length > 0 ? (
              <div
                className={cn(
                  "w-64 max-w-full overflow-hidden rounded-2xl",
                  grid && "grid grid-cols-2 gap-1",
                )}
              >
                {photos.slice(0, shown).map(tile)}
              </div>
            ) : null}
            {message.text ? (
              <p
                className={cn(
                  "px-3 py-2 text-ui rounded-2xl",
                  mine
                    ? "rounded-ee-md bg-message text-message-foreground"
                    : "rounded-es-md bg-muted",
                )}
              >
                {message.text}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
