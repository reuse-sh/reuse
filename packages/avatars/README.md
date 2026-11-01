# @reuse-sh/avatars

Avatars with images, Unicode-aware initials, and badges cut out of the image instead of painted rings. Groups keep that shape where avatars overlap.

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
