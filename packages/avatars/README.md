# @reuse-sh/avatars

Avatars with images, Unicode-aware initials, and badges cut out of the image instead of painted rings. Groups keep that shape where avatars overlap.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Cut, never paint.** Badges and overlaps are masks through the image, so no painted ring fights the background.
- **Keep initials underneath.** Initials show until the image loads and stay if it fails.
- **Name badges in words.** The badge label joins the accessible name, and the drawing stays decorative.
- **Treat text as text.** Names, labels and icons go in as text or nodes and are never parsed as HTML.
- **Size cutouts from the badge.** Counts of two digits or more get a capsule cutout measured from the badge itself.
- **Restore the host.** Destroy puts back the original content, styles and listeners.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/avatars
```

## Browser

```js
import { enhanceAvatar, createAvatarGroup } from "@reuse-sh/avatars";
import "@reuse-sh/avatars/styles.css";

const avatar = enhanceAvatar(avatarElement);
const group = createAvatarGroup(groupElement, { overlap: 12 });
```

## React

```tsx
import { Avatar, AvatarGroup } from "@reuse-sh/avatars/react";
import "@reuse-sh/avatars/styles.css";

<AvatarGroup overlap={12}>
  <Avatar name="Alex Rivers" badge={{ type: "dot", label: "Online" }} />
  <Avatar name="Sam Field" badge={{
    type: "count", count: 128, label: "128 messages",
  }} />
</AvatarGroup>
```

## Documentation

- Examples and API: https://reuse.sh/avatars
- Guide for coding agents: https://reuse.sh/avatars/guide.md

## License

MIT
