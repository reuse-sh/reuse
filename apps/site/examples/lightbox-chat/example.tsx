"use client";
import { Avatar } from "@reuse-sh/avatars/react";
import { bindLightboxGallery } from "@reuse-sh/lightbox";
import { useLightbox } from "@reuse-sh/lightbox/react";
import { type ReactNode, useEffect, useRef } from "react";
import { Picture } from "@/components/picture";
import { type Photo, photo } from "@/lib/photos";
import { cn } from "@/lib/utils";
import "./mechanics.css";

const album = [
  photo("pink-summit"),
  photo("dunes"),
  photo("cloud-peak"),
  photo("open-sea"),
  photo("lone-pine"),
  photo("dusk-beach"),
];
const shown = 3;
const last = photo("sailboat");

function PhotoLink({
  photo,
  hidden,
  children,
}: {
  photo: Photo;
  hidden?: boolean;
  children?: ReactNode;
}) {
  return (
    <a
      href={photo.src}
      className="re-chat-photo"
      data-lightbox-caption={photo.caption}
      hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
    >
      <Picture
        photo={photo}
        sizes="(max-width: 24rem) 60vw, 240px"
        loading="lazy"
      />
      {children}
    </a>
  );
}

function Thread({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  const lightbox = useLightbox({ thumbnails: "bottom" });
  useEffect(() => {
    if (root.current) return bindLightboxGallery(root.current, lightbox);
  }, [lightbox]);
  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}

function Bubble({ mine, children }: { mine?: boolean; children: ReactNode }) {
  return (
    <p
      className={cn(
        "max-w-3/4 px-3 py-2 rounded-2xl text-ui",
        mine
          ? "self-end rounded-br-md bg-message text-message-foreground"
          : "self-start rounded-bl-md bg-muted",
      )}
    >
      {children}
    </p>
  );
}

export function Example() {
  return (
    <div className="re-example re-window grid grid-cols-1 w-full min-w-0">
      <div className="re-thread-head flex items-center gap-2.5 px-4 py-3 border-b border-border">
        <Avatar
          name="Mara Lind"
          src="/images/marble-lake.webp"
          size={32}
          badge={{ type: "dot", label: "Online" }}
        />
        <span>
          <b>Mara Lind</b>
          <small>Active now</small>
        </span>
      </div>
      <Thread className="re-msgs flex flex-col gap-1.5 px-4 py-4">
        <span className="re-day self-center mb-1.5">Sunday 18:42</span>
        <Bubble>Proofs from the new series, finally</Bubble>
        <div
          className="re-tiles grid grid-rows-2 gap-1 w-4/5 aspect-landscape overflow-hidden rounded-2xl"
          data-lightbox-group="proofs"
        >
          {album.map((proof, index) => (
            <PhotoLink key={proof.id} photo={proof} hidden={index >= shown}>
              {index === shown - 1 ? (
                <span className="absolute inset-0 grid place-items-center bg-scrim/60 text-overlay-foreground text-lg font-semibold">
                  +{album.length - shown}
                </span>
              ) : null}
            </PhotoLink>
          ))}
        </div>
        <Bubble mine>The pink one is my favorite</Bubble>
        <span className="re-read self-end -mt-0.5">Read 18:44</span>
        <div
          className="re-single w-3/5 overflow-hidden rounded-2xl"
          data-lightbox-group="last"
        >
          <PhotoLink photo={last} />
        </div>
        <Bubble>And the last one, in blue and gold</Bubble>
      </Thread>
      <div className="re-compose flex items-center gap-2 px-3 py-3 border-t border-border">
        <input
          type="text"
          placeholder="Message Mara"
          aria-label="Message Mara"
        />
        <button disabled type="button" aria-label="Send" data-re-tooltip="Send">
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
  );
}
