"use client";
import "./mechanics.css";
import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";

const photos = [
  {
    id: "lake",
    src: "https://reuse.sh/images/marble-lake.webp",
    caption: "Coral sky",
    alt: "A soft marble texture in coral, sand and blue",
    width: 2400,
    height: 1800,
  },
  {
    id: "mountains",
    src: "https://reuse.sh/images/marble-mountains.webp",
    caption: "Mint and ember",
    alt: "A soft marble texture in mint, blue and orange",
    width: 2400,
    height: 1800,
  },
  {
    id: "coast",
    src: "https://reuse.sh/images/marble-coast.webp",
    caption: "Lilac bloom",
    alt: "A soft marble texture in lilac, rose and sea green",
    width: 2400,
    height: 1800,
  },
  {
    id: "forest",
    src: "https://reuse.sh/images/marble-forest.webp",
    caption: "Sand and fern",
    alt: "A soft marble texture in sand, green and violet",
    width: 2400,
    height: 1800,
  },
  {
    id: "night",
    src: "https://reuse.sh/images/marble-night.webp",
    caption: "Blue hour",
    alt: "A soft marble texture in blue, lilac and gold",
    width: 2400,
    height: 1800,
  },
  {
    id: "woods",
    src: "https://reuse.sh/images/marble-woods.webp",
    caption: "Amber",
    alt: "A soft marble texture in orange, yellow and blue",
    width: 2400,
    height: 1800,
  },
];

export function Example() {
  return (
    <div className="re-example flex flex-col items-center justify-center w-full min-w-0">
      <div className="flex flex-wrap items-center justify-center gap-10">
        <div>
          <Avatar
            name="Mara Lind"
            src={photos[0].src}
            size={64}
            badge={{ type: "dot", label: "Available" }}
          />
        </div>
        <div>
          <Avatar
            name="Sam Field"
            src={photos[1].src}
            size={64}
            badge={{ type: "count", count: 128, label: "128 unread messages" }}
          />
        </div>
        <div>
          <Avatar
            name="Robin Park"
            src={photos[2].src}
            size={64}
            badge={{
              type: "icon",
              icon: (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  aria-hidden="true"
                >
                  <path
                    d="M5 14L8.5 17.5L19 6.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.6"
                  />
                </svg>
              ),
              label: "Verified",
            }}
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-3.5">
        <AvatarGroup overlap={12}>
          <Avatar name="Alex Rivers" src={photos[3].src} size={52} />
          <Avatar name="Sam Field" src={photos[4].src} size={52} />
          <Avatar name="Robin Park" src={photos[5].src} size={52} />
          <Avatar name="Taylor Reed" src={photos[0].src} size={52} />
        </AvatarGroup>
      </div>
    </div>
  );
}
