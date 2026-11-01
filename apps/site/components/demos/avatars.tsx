"use client";

import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import { Icon } from "../icons";

export function AvatarsDemo() {
  return (
    <div className="avatar-stage">
      <div className="avatar-examples">
        <div>
          <Avatar
            name="Field notes"
            src="/_next/image?url=%2Fimages%2Flake.webp&w=128&q=75"
            size={64}
            badge={{ type: "dot", label: "Available" }}
          />
          <span>Status</span>
        </div>
        <div>
          <Avatar
            name="Sam Field"
            size={64}
            badge={{ type: "count", count: 128, label: "128 unread messages" }}
          />
          <span>Count</span>
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
          <span>Icon</span>
        </div>
      </div>
      <div className="avatar-group-example">
        <AvatarGroup overlap={12}>
          <Avatar name="Alex Rivers" size={52} />
          <Avatar name="Sam Field" size={52} />
          <Avatar name="Robin Park" size={52} />
          <Avatar name="Taylor Reed" size={52} />
        </AvatarGroup>
        <p>Actual cutouts. Any background.</p>
      </div>
    </div>
  );
}
