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

const stack = ["Mara Lind", "Jonas Weber", "Lea Novak", "Aiko Tanaka"];
const more = 5;

export function Example() {
  return (
    <div className="re-example grid w-full min-w-0">
      <AvatarGroup
        className="re-stack justify-self-center"
        overlap={12}
        role="group"
        aria-label={`${stack.length + more} people`}
      >
        {stack.map((name, index) => (
          <Avatar
            key={name}
            name={name}
            src={photos[index % photos.length].src}
            size={48}
            badge={
              index === stack.length - 1
                ? { type: "count", count: more, label: `and ${more} more` }
                : undefined
            }
          />
        ))}
      </AvatarGroup>
    </div>
  );
}
