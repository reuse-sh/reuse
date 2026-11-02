"use client";

import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import { photos } from "../../lib/photos";
import { Icon } from "../icons";

export function AvatarsDemo() {
  return (
    <div className="flex flex-col items-center justify-center">
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
              icon: <Icon name="check" size={12} />,
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
