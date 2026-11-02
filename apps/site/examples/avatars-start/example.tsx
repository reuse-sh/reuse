import { Avatar } from "@reuse-sh/avatars/react";
import "@reuse-sh/avatars/styles.css";

const members = [
  {
    name: "Mara Lind",
    role: "Print editor",
    src: "https://reuse.sh/images/marble-lake.svg",
    badge: { type: "dot", label: "Online" },
  },
  {
    name: "Sam Field",
    role: "",
    src: "https://reuse.sh/images/marble-mountains.svg",
    badge: { type: "count", label: "128 unread messages", count: 128 },
  },
  {
    name: "Robin Park",
    role: "",
    src: "https://reuse.sh/images/marble-coast.svg",
    badge: { type: "icon", label: "Verified", icon: "\u2713" },
  },
] as const;
export function Example() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[840px] p-6 font-sans text-[15px] leading-relaxed text-neutral-800">
      <div className="flex flex-wrap gap-8 p-6">
        {members.map((member) => (
          <Avatar
            key={member.name}
            name={member.name}
            src={member.src}
            size={64}
            badge={"badge" in member ? member.badge : undefined}
          />
        ))}
      </div>
    </div>
  );
}
