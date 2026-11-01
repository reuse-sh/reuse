"use client";

import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import { photos } from "../../lib/photos";
import { Icon } from "../icons";

export function AvatarsDemo() {
  return (
    <div className="avatar-stage">
      <div className="avatar-examples">
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
            size={64}
            badge={{ type: "count", count: 128, label: "128 unread messages" }}
          />
        </div>
        <div>
          <Avatar
            name="Robin Park"
            size={64}
            badge={{
              type: "icon",
              icon: <Icon name="check" size={12} />,
              label: "Verified",
            }}
          />
        </div>
      </div>
      <div className="avatar-group-example">
        <AvatarGroup overlap={12}>
          <Avatar name="Alex Rivers" size={52} />
          <Avatar name="Sam Field" size={52} />
          <Avatar name="Robin Park" size={52} />
          <Avatar name="Taylor Reed" size={52} />
        </AvatarGroup>
      </div>
    </div>
  );
}
