"use client";
import { Avatar, type AvatarBadge } from "@reuse-sh/avatars/react";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { CSSProperties } from "react";
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

const away = {
  "--re-avatar-status-color": "var(--subtle-foreground)",
} as CSSProperties;

const members: {
  name: string;
  role: string;
  badge?: AvatarBadge;
  style?: CSSProperties;
}[] = [
  {
    name: "Mara Lind",
    role: "Print editor",
    badge: { type: "dot", label: "Online" },
  },
  {
    name: "Jonas Weber",
    role: "Producer",
    badge: { type: "dot", label: "Away" },
    style: away,
  },
  {
    name: "Aiko Tanaka",
    role: "Writer",
    badge: { type: "count", count: 3, label: "3 unread messages" },
  },
  {
    name: "Lea Novak",
    role: "Owner",
    badge: {
      type: "icon",
      icon: (
        <svg
          width="10"
          height="10"
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
    },
  },
  { name: "Theo Brandt", role: "Framer" },
  {
    name: "Ines Duarte",
    role: "Guest",
    badge: { type: "count", count: 12, label: "12 unread messages" },
  },
];

export function Example() {
  return (
    <div className="re-example w-full min-w-0">
      <MovingHighlight className="re-members mx-auto w-full max-w-100">
        <ul className="re-member-list grid p-1.5" aria-label="Members">
          {members.map((member, index) => (
            <li
              key={member.name}
              className="re-member grid items-center gap-3 px-2.5 py-2 rounded-control"
              data-re-row=""
            >
              <Avatar
                name={member.name}
                src={photos[index % photos.length].src}
                size={36}
                badge={member.badge}
                style={member.style}
              />
              <span className="re-member-text grid min-w-0">
                <b className="re-member-name text-ui font-medium">
                  {member.name}
                </b>
                <small className="re-member-meta text-caption text-subtle-foreground">
                  {member.role}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </MovingHighlight>
    </div>
  );
}
