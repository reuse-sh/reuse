# @reuse-sh/lightbox

An image viewer that opens from a thumbnail, including a cropped one, and returns to it on close. Pages scroll and swipe with the browser, and images zoom with pinch, pan, double-tap, and the pointer.

<!-- principles:start -->

## Principles

These are the rules the code keeps. An adaptation on any framework keeps them too.

- **Page with native scroll snap.** Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum. A key, a thumbnail or goTo() during a held mouse drag ends the drag and goes straight to the new photo, so its release does not page back.
- **Open from the thumbnail and return to it.** The image grows out of its cropped preview with the tile's rounded corners and shrinks back into the current photo's tile on close.
- **Load only what is near.** Only the current and neighboring images load, the current one first, the neighbors not at all under Save-Data, and a long jump skips the pages in between.
- **Scrub through the strip.** A drag or a wheel on the thumbnail strip swaps the photo as each thumbnail reaches the ring, a scroll that ends in one frame too, with previews standing in until it stops, and reports and announces the photo it stops on once. A horizontal wheel over a bottom thumbnail uses native scrolling, and the empty ends of the strip pass pointer input through. Arrows, Home and End in the strip page the viewer, the arrows wrapping when loop is on, and focus and the tab stop follow the thumbnail under the ring. A thumbnail is at most three times as wide as it is tall.
- **Zoom around the point you touch.** Pinch, wheel, a double tap and a click zoom in around the pointer or fingers, and a double tap, a click or the zoom button zooms back out to the whole photo. A pinch and a wheel follow the input at once, and the rest ease over the zoom duration from wherever the photo is. A single finger tap shows or hides the controls.
- **Keep focus inside and give it back.** The viewer is a native modal dialog, and closing it returns focus to the current photo's tile, or else to the element that opened it.
- **Leave the page as it was.** Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched, the abort listeners on your signals included. Back closes the viewer, and its one history entry leaves without a navigation, also when another viewer opened above it.
- **Behave like the platform's photo viewer.** Gestures, keys and timing match iOS Photos, macOS Photos and Google Photos unless a recorded decision says otherwise.
- **Dismiss like a photos app.** A vertical swipe carries the photo, fades the backdrop and the controls with it, and closes past a distance or a speed. A cancelled pointer never closes, a second finger leaves the swipe with the first, and a close ends the gesture.
- **Let the photo lead.** Controls fade in after the photo starts moving and leave before it. They hide while zoomed and after a still pointer, and a still pointer never hides them while one is hovered or keyboard-focused. While zoomed only close and zoom come back, focus on any other control, or on one a zoom stops rendering, moves to the photo, and the photo pans to the window's edges under the room the other controls kept.
- **Frame a photo that reads as a page.** A photo more than twice as tall as it is wide rests in a window the padding below the toolbar, beside the arrows and above the bottom room, ringed with --re-lightbox-media-ring, and scrolls inside it, so no control and no caption sits on it and a pale page still shows its edge on a pale room. Zoomed in, during a dismiss drag and in the open and close flights the window opens to the whole screen, and the ring shows only at the photo's resting size.
- **Change the caption with the photo.** Each page fades the caption out while it rises 0.4em and fades the next one in as it rises from 0.4em below, over --re-lightbox-fade-duration, the other way when paging back, and swaps its text while it is hidden, so a caption of another height, or none, never jumps into view. A page during the fade goes on from the opacity and the shift on screen with the newest caption, the shift adds to a host's own translate, and reduced motion swaps it at once. The announcement of the settled photo reads its number and its caption once, through strings.slide(index, count, caption), so a translation sets the order and the separator.
- **Return to what is on screen.** Close goes back to the current photo's tile, after bringing it into view in its own carousel, and fades in place when the tile cannot be seen, in the window and in every container that clips it. A close during a mouse drag or a fling ends it, puts the strip on the current photo at once and flies from where the photo was, with no neighbor in view. The page scrolls and takes clicks during the flight and stays where it was scrolled once the viewer is gone, focus moved there stays, the tile's container does not cut the photo before it nears the tile, and the landing photo never changes the size of a scroll area.
- **Fetch the pixels the screen shows.** Each image loads the source that fits the rendered size, a zoom asks for more, and the preview stays until the sharper file has decoded and no finger holds the photo. A photo without a size fits the screen at its tile's proportions from the start and eases to its file's size once the file decodes.
- **Roll the count with the page.** Every counter, the built-in one and each a slot takes from counter(), rolls a changed digit up when paging forward and down when paging back, and switches at once under reduced motion.
- **Zoom to real pixels.** Zoom levels follow the image's own resolution. Panning stretches past the edge and glides on release.
- **Never block a frame.** No layout read or framework render runs per pointer move, scroll or wheel event.
- **Press like a native button.** A pressed control shrinks to --re-lightbox-press-scale, but a mouse press acts on release anywhere over the size it rests at, its outer edge included, and a release off it does nothing.
- **Give focus back quietly.** A click or a tap opens with focus on the close button and no ring. Focus returns to the photo's tile without a ring after a pointer close, and with one after a keyboard close, unless the visitor moved it during the close flight.
- **Show every shape readably.** A long screenshot opens at the screen's width and scrolls, a panorama zooms to the screen's height, a transparent photo sits on its own backing, and an SVG takes the size its file declares.
- **Hand the photo to the system.** The photo is a real image: the browser's menu saves and copies it, and Cmd or Ctrl and C copies it. protect turns these off. A mouse drag on it pages like a finger, so saving stays on Download and the context menu.
- **Stay light in large galleries.** A thousand photos open as fast as ten. Slides outside the preload window are empty shells, the strip's positions are arithmetic, and the next photo in the direction of travel loads first.
- **Let a slideshow yield.** A slideshow waits while the photo is zoomed, a video or audio slide plays, an embed is on screen, the mouse is over the controls, the tab is hidden or a slot's menu is open, and goes on with the time it had left, or at once when the video or audio ends. From the last photo it returns to the first without showing the photos between.
- **Play only the current slide.** Video, audio and embeds are optional modules. Leaving a slide pauses its player, close pauses them all at once, and over a player the pointer belongs to the player.
- **Trust no page by default.** Items read from markup are untrusted. An embed plays only a known provider, every frame from another origin and every popup it opens is sandboxed, and Download offers only web, blob and raster data files and never navigates the tab away.
- **Publish one state.** getState() returns the snapshot subscribers last received, so a gesture shows up once it settles, and a React component re-renders only for the part of it that it selects and hydrates from the state the lightbox was created with.
- **Take settings from markup or code.** A gallery reads JSON options from its markup under the options given in code, only while a photo from that gallery is open, and JSON it cannot read throws an error that names the element. A link is a trigger only when it holds an image or carries lightbox data, never a download link, and a trigger with no image file and no media type, or one clicked after the lightbox is destroyed, keeps its own click.
- **Survive every interruption.** Opening, closing, swiping, zooming, resizing, appending or destroying at any moment, or a callback that throws during open, leaves no dialog, timer, hidden tile, scroll lock or extra history entry behind.

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
  import {
    bindLightboxGallery,
    createLightbox,
  } from "/assets/lightbox/browser/lightbox.js";

  const lightbox = createLightbox();
  const unbind = bindLightboxGallery(document.querySelector("#gallery"), lightbox);
</script>
```

A theme or a plugin that prints its settings into the page can put them on the gallery as JSON, such as `<div id="gallery" data-lightbox-options='{"thumbnails":"bottom","loop":true}'>`. They fill whatever the lightbox was not given in code while a photo from that gallery is open, so galleries that share one lightbox keep their own settings, and JSON that does not parse throws a `TypeError` that names the element. A link opens in the lightbox when it holds an image or carries `data-lightbox-type` or `data-lightbox-src`, so a text link such as "Download full size" and any link with `download` stay links. Captions come from a `figcaption`, else `data-lightbox-caption`.

## Trust

Items read from markup are untrusted: `data-lightbox-type`, a link's `href` and `data-lightbox-src` come from whoever wrote the page. `embed()` plays only YouTube, Vimeo and the providers you pass in `embed({ providers })`, and any other URL stays blank. Every frame `iframe()` or `embed()` loads from another origin, a provider's player included, gets `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups"`, so it cannot navigate your tab. Its popups keep the sandbox, so they cannot navigate it either. A page from your own origin loads unsandboxed, so a quick view keeps its links. That makes a same-origin URL trusted: an open redirect on your site leads the frame to any page without a sandbox. Pass `sandbox` to either module to set the attribute yourself. The Download button appears only for an `http:`, `https:` or `blob:` file or a PNG, JPEG, GIF, WebP or AVIF `data:` image. A web file, same-origin included, is fetched when the button is pressed and saved under the name its `Content-Disposition` header gives when the page can read it, else its decoded name, or opened in a new tab when its server refuses the fetch, so the page itself never navigates.

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

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile. The React hook closes its viewer at once and frees it on unmount or when Activity hides it, and opens the same viewer again when Activity shows it.

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

Run this after the markup exists. Keep the lightbox and the unbind function for the lifetime of this content.

```javascript
import { bindLightboxGallery, createLightbox } from "@reuse-sh/lightbox";

const lightbox = createLightbox();
const unbind = bindLightboxGallery(document.querySelector("#gallery"), lightbox);
```

#### Integration

Links still open the image without JavaScript. The native dialog keeps focus inside, Escape closes it, and close returns focus to the current photo's tile.

#### Cleanup

Run this when the view is removed, before mounting another controller on the same element.

```javascript
unbind();
lightbox.destroy();
```

<!-- examples:end -->

## Documentation

- Examples and API: https://reuse.sh/lightbox
- Guide for coding agents: https://reuse.sh/lightbox/guide.md

## License

MIT
