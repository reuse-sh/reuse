import { Avatar, type AvatarBadge, AvatarGroup } from "@reuse-sh/avatars/react";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import type { CSSProperties } from "react";
import { photos } from "../../lib/photos";
import { Icon } from "../icons";
import { basicCode } from "./basic-code";
import { ExampleCode, Stage } from "./parts";

const away = { "--re-avatar-status-color": "#d08a1c" } as CSSProperties;

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
      <Stage>
        <div className="c-card x-members">
          <MovingHighlight className="c-card-in">
            <ul className="x-member-list" aria-label="Members">
              {members.map((member, index) => (
                <li key={member.name} className="x-member" data-re-row="">
                  <Avatar
                    name={member.name}
                    src={photos[index % photos.length].src}
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
          </MovingHighlight>
        </div>
      </Stage>
      <ExampleCode js={js} react={react} />
    </>
  );
}

const stack = ["Mara Lind", "Jonas Weber", "Lea Novak", "Aiko Tanaka"];
const more = 5;

export function AvatarsStack() {
  const [js, react] = basicCode.stack;
  return (
    <>
      <Stage>
        <AvatarGroup
          className="x-stack"
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
      </Stage>
      <ExampleCode js={js} react={react} />
    </>
  );
}
