"use client";
import "./mechanics.css";
import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";

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
