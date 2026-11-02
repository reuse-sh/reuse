# @reuse-sh/avatars

Avatars with images, Unicode-aware initials, and badges cut out of the image instead of painted rings. Groups keep that shape where avatars overlap.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Show content before enhancement.** Photos and initials are available before scripts run, and initials remain when an image fails.
- **Cut, never paint.** Badges and overlaps are vector clips through the avatar, so no painted ring fights the background and the edge stays sharp at any zoom.
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

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/avatars/getting-started)

### React

#### Package styles

Import the package stylesheet once in your main CSS. The components layer lets Tailwind utilities adapt its presentation.

```css
@import "@reuse-sh/avatars/styles.css" layer(components);
```

#### Usage

Render a name, optional photo and meaningful badge label. The component keeps initials underneath the photo and enhances badge cutouts after mounting.

```tsx
import { Avatar } from "@reuse-sh/avatars/react";

export function Person() {
  return <Avatar name="Alex Morgan" src="/images/alex.jpg" badge={{ type: "dot", label: "Available" }} />;
}
```

#### Integration

The badge label joins the accessible name. The image has empty alt because the avatar already names the person. Initials remain if the photo fails; without JavaScript the markup still shows the person and status. The React wrapper owns cleanup.

### HTML + JavaScript

#### Usage

Render a name, optional photo and meaningful badge label. The component keeps initials underneath the photo and enhances badge cutouts after mounting.

```html
<span id="person" class="re-avatar" data-re-avatar role="img" aria-label="Alex Morgan, Available">
  <span class="re-avatar-face" data-re-avatar-face aria-hidden="true">AM<img class="re-avatar-image" src="/images/alex.jpg" alt="" /></span>
  <span class="re-avatar-badge" data-re-avatar-badge="dot" aria-hidden="true"></span>
</span>
```

#### Styles

Import the package stylesheet once. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/avatars/styles.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { enhanceAvatar } from "@reuse-sh/avatars";

const avatar = enhanceAvatar(document.querySelector("#person"));
```

#### Integration

The badge label joins the accessible name. The image has empty alt because the avatar already names the person. Initials remain if the photo fails; without JavaScript the markup still shows the person and status.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
avatar.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/avatars
- Guide for coding agents: https://reuse.sh/avatars/guide.md

## License

MIT
