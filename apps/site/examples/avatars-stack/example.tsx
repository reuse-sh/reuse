import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import "@reuse-sh/avatars/styles.css";

const members = [
  {
    name: "Mara Lind",
    role: "Print editor",
    src: "https://reuse.sh/images/marble-lake.svg",
  },
  {
    name: "Jonas Weber",
    role: "Producer",
    src: "https://reuse.sh/images/marble-mountains.svg",
  },
  {
    name: "Lea Novak",
    role: "Owner",
    src: "https://reuse.sh/images/marble-coast.svg",
  },
  {
    name: "Aiko Tanaka",
    role: "Writer",
    src: "https://reuse.sh/images/marble-forest.svg",
    badge: { type: "count", label: "and 5 more", count: 5 },
  },
] as const;
export function Example() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-4 sm:p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <AvatarGroup overlap={12} role="group" aria-label="9 people">
        {members.map((member) => (
          <Avatar
            key={member.name}
            name={member.name}
            src={member.src}
            size={48}
            badge={"badge" in member ? member.badge : undefined}
          />
        ))}
      </AvatarGroup>
    </div>
  );
}
