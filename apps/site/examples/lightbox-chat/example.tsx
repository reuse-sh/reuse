"use client";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { useEffect, useState } from "react";
import "@reuse-sh/lightbox/styles.css";

const photos = [
  {
    id: "lake",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    src: "https://reuse.sh/images/marble-lake.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "coast",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    src: "https://reuse.sh/images/marble-coast.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "woods",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    src: "https://reuse.sh/images/marble-woods.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "mountains",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    src: "https://reuse.sh/images/marble-mountains.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "forest",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    src: "https://reuse.sh/images/marble-forest.svg",
    width: 1600,
    height: 1200,
  },
  {
    id: "night",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    src: "https://reuse.sh/images/marble-night.svg",
    width: 1600,
    height: 1200,
  },
];
function Photo({
  photo,
  items,
  hidden = false,
  more = 0,
  className = "",
}: {
  photo: (typeof photos)[number];
  items: typeof photos;
  hidden?: boolean;
  more?: number;
  className?: string;
}) {
  const viewer = useLightbox({ thumbnails: true });
  return (
    <a
      href={photo.src}
      hidden={hidden}
      className={`relative block ${hidden ? "hidden" : ""} ${className}`}
      onClick={(event) => {
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        viewer.open(
          items.map((item) => ({
            ...item,
            thumbnailSrc: item.src,
            origin:
              item.id === photo.id
                ? event.currentTarget.querySelector("img")
                : null,
          })),
          items.indexOf(photo),
        );
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: this standalone recipe uses native images outside Next.js. */}
      <img
        className="h-full w-full rounded-xl object-cover"
        src={photo.src}
        alt={photo.alt}
        width={1600}
        height={1200}
        draggable={false}
      />
      {more > 0 && (
        <span className="absolute inset-0 grid place-items-center rounded-xl bg-black/40 text-3xl text-white">
          +{more}
        </span>
      )}
    </a>
  );
}
const people = [
  ["Mara Lind", "Proofs from the new series, finally", "18:42"],
  ["Jonas Weber", "Invoice is in the shared folder", "16:05"],
  ["Aiko Tanaka", "See you at ten", "Thu"],
  ["Lea Novak", "Thanks, that works", "Tue"],
];
export function Example() {
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  useEffect(() => setReady(true), []);
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden border-r border-neutral-100 pr-5 sm:block">
          <b>Messages</b>
          {people.map(([name, text, time], index) => (
            <button
              type="button"
              disabled={!ready}
              aria-current={index === current ? "true" : undefined}
              onClick={() => setCurrent(index)}
              className="my-2 block w-full rounded-xl p-3 text-left hover:bg-neutral-100 aria-[current=true]:bg-neutral-100"
              key={name}
            >
              <b>{name}</b>
              <small className="block text-xs text-neutral-500">
                {text} · {time}
              </small>
            </button>
          ))}
        </aside>
        <section className="min-w-0">
          <header>
            <b>Mara Lind</b>
            <small className="block text-xs text-neutral-500">Active now</small>
          </header>
          <p className="mt-5 text-sm text-neutral-500">Sunday 18:42</p>
          <p className="my-4">Proofs from the new series, finally</p>
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo, index) => (
              <Photo
                key={photo.id}
                photo={photo}
                items={photos}
                hidden={index > 2}
                more={index === 2 ? 3 : 0}
                className="aspect-square"
              />
            ))}
          </div>
          <p className="mt-4 text-right">The coral one is my favorite</p>
          <p className="mb-4 text-right text-xs text-neutral-500">Read 18:44</p>
          <Photo photo={photos[5]} items={[photos[5]]} className="max-w-60" />
          <p className="my-4">And the last one, in blue and gold</p>
          {messages.map((message) => (
            <p className="my-4 text-right" key={message.id}>
              {message.text}
            </p>
          ))}
          <form
            className="mt-5 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              setMessages([
                ...messages,
                { id: crypto.randomUUID(), text: draft },
              ]);
              setDraft("");
            }}
          >
            <input
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 p-2"
              aria-label="Message Mara"
              placeholder="Message Mara"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              required
            />
            <button
              className="rounded-lg bg-neutral-100 p-2 disabled:opacity-50"
              disabled={!ready}
              type="submit"
            >
              Send
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
