# @reuse-sh/lightbox

An image viewer that opens from a thumbnail, including a cropped one, and returns to it on close. Pages scroll and swipe with the browser, and images zoom with pinch, pan, double-tap, and the pointer.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Page with native scroll snap.** Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum.
- **Open from the thumbnail and return to it.** The image grows out of its cropped preview and shrinks back into the current photo's tile on close.
- **Load only what is near.** Only the current and neighboring images load, the current one first, the neighbors not at all under Save-Data, and a long jump skips the pages in between.
- **Zoom around the point you touch.** Pinch, wheel and double-tap zoom in around the pointer or fingers, and a tap, click or the zoom button zooms back out to the whole photo.
- **Keep focus inside and give it back.** The viewer is a native modal dialog, and closing it returns focus to the current photo's tile, or else to the element that opened it.
- **Leave the page as it was.** Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched. Back closes the viewer, and its one history entry leaves without a navigation.
- **Behave like the platform's photo viewer.** Gestures, keys and timing match iOS Photos, macOS Photos and Google Photos unless a recorded decision says otherwise.
- **Dismiss like a photos app.** A vertical swipe carries the photo, fades the backdrop and the controls with it, and closes past a distance or a speed. A cancelled pointer never closes.
- **Let the photo lead.** Controls fade in after the photo starts moving and leave before it. They hide while zoomed and after a still pointer, never while hovered or focused.
- **Return to what is on screen.** Close goes back to the current photo's tile, after bringing it into view in its own carousel, and fades in place when the tile cannot be seen or the strip is still moving. The page scrolls and takes clicks during the flight, focus moved there stays, and the tile's container does not cut the photo before it nears the tile.
- **Fetch the pixels the screen shows.** Each image loads the source that fits the rendered size, a zoom asks for more, and the preview stays until the sharper file has decoded.
- **Zoom to real pixels.** Zoom levels follow the image's own resolution. Panning stretches past the edge and glides on release.
- **Never block a frame.** No layout read or framework render runs per pointer move, scroll or wheel event.
- **Give focus back quietly.** A click or a tap opens with focus on the close button and no ring. Focus returns to the photo's tile without a ring after a pointer close, and with one after a keyboard close.
- **Show every shape readably.** A long screenshot opens at the screen's width and scrolls, a panorama zooms to the screen's height, a transparent photo sits on its own backing, and an SVG takes the size its file declares.
- **Hand the photo to the system.** The photo is a real image: the browser's menu saves and copies it, and Cmd or Ctrl and C copies it. protect turns these off. A mouse drag on it pages like a finger.
- **Stay light in large galleries.** A thousand photos open as fast as ten. Slides outside the preload window are empty shells, the strip's positions are arithmetic, and the next photo in the direction of travel loads first.
- **Let a slideshow yield.** A slideshow waits while the photo is zoomed, the mouse is over the controls, the tab is hidden or a slot's menu is open, and goes on with the time it had left.
- **Play only the current slide.** Video, audio and embeds are optional modules. Leaving a slide pauses its player, close pauses them all at once, and over a player the pointer belongs to the player.
- **Survive every interruption.** Opening, closing, swiping, zooming, resizing, appending or destroying at any moment leaves no dialog, timer, hidden tile, scroll lock or extra history entry behind.

<!-- principles:end -->

## Install

```sh
npm install @reuse-sh/lightbox
```

## Browser build

For a page without a bundler or an import map, such as a theme or a plugin, copy `dist/browser/`, `dist/base.css` and `dist/theme.css` from the package into your assets. `lightbox.js` is one minified ES module with a source map and no imports, with the carousel inside it. `base.css` holds the layout in `@layer re.base` and `theme.css` the default theme in `@layer re.theme`; `dist/unlayered/` holds both without layers for a site whose own unlayered styles would win.

```html
<link rel="stylesheet" href="/assets/lightbox/base.css" />
<link rel="stylesheet" href="/assets/lightbox/theme.css" />
<script type="module">
  import { bindLightboxGallery } from "/assets/lightbox/browser/lightbox.js";

  const gallery = bindLightboxGallery(document.querySelector("#gallery"), {});
</script>
```

<!-- examples:start -->

## Usage

[Documentation](https://reuse.sh/lightbox/getting-started)

### React

#### Package styles

Import the package stylesheets once in your main CSS: base.css holds the layout and theme.css the default theme. The components layer lets Tailwind utilities adapt their presentation.

```css
@import "@reuse-sh/lightbox/base.css" layer(components);
@import "@reuse-sh/lightbox/theme.css" layer(components);
```

#### Usage

Keep a real image link as the trigger, then open its full-size image through useLightbox. The origin image gives the opening and closing transition its actual crop.

```tsx
"use client";

import { useLightbox } from "@reuse-sh/lightbox/react";

export function Gallery() {
  const lightbox = useLightbox({});
  return (
    <a href="/images/print-large.jpg" onClick={(event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lightbox.open([{
        src: event.currentTarget.href,
        alt: "Marble print",
        origin: event.currentTarget.querySelector("img"),
      }]);
    }}>
      <img src="/images/print.jpg" alt="Marble print" width="640" height="480" />
    </a>
  );
}
```

#### Integration

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile. The React hook destroys its viewer on unmount.

### HTML + JavaScript

#### Usage

Keep a real image link as the trigger, then enhance the gallery with bindLightboxGallery. The origin image gives the opening and closing transition its actual crop.

```html
<div id="gallery">
  <a href="/images/print-large.jpg">
    <img data-lightbox-src="/images/print-large.jpg" src="/images/print.jpg" alt="Marble print" width="640" height="480" />
  </a>
</div>
```

#### Styles

Import the package stylesheets once: base.css holds the layout and theme.css the default theme. Keep application layout styles scoped to this integration.

```css
@import "@reuse-sh/lightbox/base.css";
@import "@reuse-sh/lightbox/theme.css";
```

#### Initialize

Run this after the markup exists. Keep the returned controller for the lifetime of this content.

```javascript
import { bindLightboxGallery } from "@reuse-sh/lightbox";

const gallery = bindLightboxGallery(document.querySelector("#gallery"), {});
```

#### Integration

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
gallery.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/lightbox
- Guide for coding agents: https://reuse.sh/lightbox/guide.md

## License

MIT
