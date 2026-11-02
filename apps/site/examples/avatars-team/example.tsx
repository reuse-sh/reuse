import { Avatar } from "@reuse-sh/avatars/react";
import { MovingHighlight } from "@reuse-sh/interactions/react";
import "@reuse-sh/avatars/styles.css";
import "@reuse-sh/interactions/styles.css";

const members = [
  {
    name: "Mara Lind",
    role: "Print editor",
    src: "https://reuse.sh/images/marble-lake.svg",
    badge: { type: "dot", label: "Online" },
  },
  {
    name: "Jonas Weber",
    role: "Producer",
    src: "https://reuse.sh/images/marble-mountains.svg",
    badge: { type: "dot", label: "Away" },
  },
  {
    name: "Aiko Tanaka",
    role: "Writer",
    src: "https://reuse.sh/images/marble-coast.svg",
    badge: { type: "count", label: "3 unread messages", count: 3 },
  },
  {
    name: "Lea Novak",
    role: "Owner",
    src: "https://reuse.sh/images/marble-forest.svg",
    badge: { type: "icon", label: "Verified", icon: "\u2713" },
  },
  {
    name: "Theo Brandt",
    role: "Framer",
    src: "https://reuse.sh/images/marble-night.svg",
  },
  {
    name: "Ines Duarte",
    role: "Guest",
    src: "https://reuse.sh/images/marble-woods.svg",
    badge: { type: "count", label: "12 unread messages", count: 12 },
  },
] as const;
export function Example() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <MovingHighlight className="max-w-[440px]">
        <ul className="m-0 list-none p-0" aria-label="Members">
          {members.map((member) => (
            <li
              key={member.name}
              className="flex items-center gap-3 rounded-xl p-3"
              data-re-row
            >
              <Avatar
                name={member.name}
                src={member.src}
                size={36}
                badge={"badge" in member ? member.badge : undefined}
                className={
                  member.name === "Jonas Weber"
                    ? "[--re-avatar-status-color:#d08a1c]"
                    : undefined
                }
              />
              <span>
                <b className="font-medium">{member.name}</b>
                <small className="block text-[13px] text-neutral-500">
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
