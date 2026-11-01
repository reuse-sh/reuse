import { Avatar, type AvatarBadge, AvatarGroup } from "@reuse-sh/avatars/react";
import type { CSSProperties } from "react";
import { photos } from "../../lib/photos";
import { Icon } from "../icons";
import { basicCode } from "./basic-code";
import { ExampleCode } from "./parts";

const away = { "--reuse-avatar-status-color": "#d08a1c" } as CSSProperties;

const members: {
  name: string;
  role: string;
  photo?: number;
  badge?: AvatarBadge;
  style?: CSSProperties;
}[] = [
  {
    name: "Mara Lind",
    role: "Print editor",
    photo: 0,
    badge: { type: "dot", label: "Online" },
  },
  {
    name: "Jonas Weber",
    role: "Producer",
    photo: 1,
    badge: { type: "dot", label: "Away" },
    style: away,
  },
  {
    name: "Aiko Tanaka",
    role: "Writer",
    photo: 3,
    badge: { type: "count", count: 3, label: "3 unread messages" },
  },
  {
    name: "Lea Novak",
    role: "Owner",
    photo: 2,
    badge: {
      type: "icon",
      icon: <Icon name="check" size={10} />,
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

export function AvatarsTeam() {
  const [js, react] = basicCode.team;
  return (
    <>
      <section className="x-members" aria-labelledby="x-members-h">
        <header className="x-members-head">
          <h2 id="x-members-h" className="x-members-title">
            Members
          </h2>
          <span className="x-members-count">{members.length} people</span>
        </header>
        <ul className="x-member-list">
          {members.map((member) => (
            <li key={member.name} className="x-member">
              <Avatar
                name={member.name}
                src={
                  member.photo === undefined
                    ? undefined
                    : photos[member.photo].src
                }
                size={36}
                badge={member.badge}
                style={member.style}
              />
              <span className="x-member-text">
                <b className="x-member-name">{member.name}</b>
                <small className="x-member-meta">{member.role}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <ExampleCode js={js} react={react} />
    </>
  );
}

const projects = [
  ["Spring catalogue", "Edited today", [0, 1, 2, 3], 5],
  ["Coral sky reprint", "Edited yesterday", [2, 4, 5], 0],
  ["Gallery wall kit", "Edited on Monday", [5, 3, 0, 1], 12],
] as const;

const names = [
  "Mara Lind",
  "Jonas Weber",
  "Lea Novak",
  "Aiko Tanaka",
  "Theo Brandt",
  "Ines Duarte",
];

export function AvatarsGroups() {
  const [js, react] = basicCode.groups;
  return (
    <>
      <ul className="x-projects">
        {projects.map(([title, edited, people, rest]) => (
          <li key={title} className="x-project">
            <span className="x-project-text">
              <b className="x-member-name">{title}</b>
              <small className="x-member-meta">{edited}</small>
            </span>
            <AvatarGroup
              overlap={10}
              role="group"
              aria-label={`${people.length + rest} people`}
            >
              {people.map((index, position) => (
                <Avatar
                  key={index}
                  name={names[index]}
                  src={index < 4 ? photos[index].src : undefined}
                  size={32}
                  badge={
                    rest && position === people.length - 1
                      ? {
                          type: "count",
                          count: rest,
                          label: `and ${rest} more`,
                        }
                      : undefined
                  }
                />
              ))}
            </AvatarGroup>
          </li>
        ))}
      </ul>
      <ExampleCode js={js} react={react} />
    </>
  );
}
