import type { UsagePlatform } from "./usage-types.js";

export { type GestureRow, lightboxGestures } from "./gestures.js";
export { lightboxShareSlot } from "./share.js";
/** A name and its explanation: an API entry or a principle. */
export type Row = readonly [name: string, text: string];

export type Principle = readonly [
  name: string,
  text: string,
  testPath?: string,
];

/** One documentation page. The path is relative to the library, "" for its overview. */
export interface DocPage {
  path: string;
  title: string;
  lead: string;
  /** For an example page: what an agent builds from it, as in "build a product page gallery". */
  build?: string;
}

export interface DocGroup {
  title: string;
  pages: readonly DocPage[];
}

export type DocEntry = DocPage | DocGroup;

export interface Library {
  slug: string;
  name: string;
  description: string;
  packageName: string;
  principles: readonly Principle[];
  api: readonly Row[];
  notes: readonly string[];
  pages: readonly DocEntry[];
}

export interface FlatDocPage extends DocPage {
  group?: string;
}

function guideUrl(slug: string) {
  return `https://reuse.sh/${slug}/guide.md`;
}

const lightboxDescription =
  "An image viewer that grows out of the thumbnail and zooms into the detail.";
const carouselDescription =
  "A scroll-snap strip with drag, loop and autoplay, built on your own markup.";
const tooltipDescription =
  "One shared hint that follows the pointer and slides between triggers.";
const previewDescription =
  "A picture of where a link leads, carried by the pointer and swapped as it moves down the list.";
const annotationsDescription =
  "Areas, arrows and notes on an image, kept in one format your tools can share.";
const loadersDescription =
  "A few dots that change shape while an answer is on its way.";
const shadowsDescription =
  "Six shadow levels and a hairline ring, in one stylesheet with no JavaScript.";
const highlightDescription =
  "One background that slides to the row under the pointer, the focus or the selection.";
const holdDescription =
  "A button that acts only after a full press. Let go early and nothing happens.";
const gradientsDescription =
  "Gradients that follow an easing curve, so a fade ends without a hard edge.";
const copyDescription =
  "A button that copies text, swaps its icon for a check and says what happened.";
const avatarsDescription =
  "Photos and initials with badges and groups, cut out cleanly on any background.";
const justifiedDescription =
  "Rows of pictures that keep their proportions and fill the width edge to edge.";
const stageDescription =
  "A scripted cursor that plays your real components in a live, looping product demo.";
const masonryDescription =
  "Cards stacked into columns without gaps between rows, natively where the browser can.";

/** The rules every library in the collection follows. */
export const collectionPrinciples: readonly Row[] = [
  [
    "Run on any stack",
    "Each part is a plain browser module with a thin React wrapper, so it works the same in Vue, Svelte or a page with no framework.",
  ],
  [
    "Build on the browser",
    "Parts use what modern browsers already do well: native dialogs, CSS scroll snap and CSS animations. They stay small and feel native.",
  ],
  [
    "Leave the page alone",
    "Styles stay inside the part and never reach the rest of your page. When a part is removed, it takes everything it added with it.",
  ],
  [
    "Work from the keyboard",
    "Real buttons, dialogs and focus order let every part work without a mouse and with a screen reader.",
  ],
  [
    "Move calmly",
    "Motion can be interrupted halfway without a jump, and it stops when your system asks for less motion.",
  ],
  [
    "Write the rules down",
    "Each library lists its principles and ships a guide, so your coding agent can rebuild it on any stack and keep them.",
  ],
];

export const libraries: Library[] = [
  {
    slug: "lightbox",
    name: "Lightbox",
    description: lightboxDescription,
    packageName: "@reuse-sh/lightbox",
    principles: [
      [
        "Page with native scroll snap",
        "Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum. A key, a thumbnail or goTo() during a held mouse drag ends the drag and goes straight to the new photo, so its release does not page back.",
      ],
      [
        "Open from the thumbnail and return to it",
        "The image grows out of its cropped preview with the tile's rounded corners and shrinks back into the current photo's tile on close.",
      ],
      [
        "Load only what is near",
        "Only the current and neighboring images load, the current one first, the neighbors not at all under Save-Data, and a long jump skips the pages in between.",
        "tests/browser/lightbox-images.spec.ts",
      ],
      [
        "Scrub through the strip",
        "A drag or a wheel on the thumbnail strip swaps the photo as each thumbnail reaches the ring, a scroll that ends in one frame too, with previews standing in until it stops, and reports and announces the photo it stops on once. A horizontal wheel over a bottom thumbnail uses native scrolling, and the empty ends of the strip pass pointer input through. Arrows, Home and End in the strip page the viewer, the arrows wrapping when loop is on, and focus and the tab stop follow the thumbnail under the ring. A thumbnail is at most three times as wide as it is tall.",
        "tests/browser/lightbox-controls.spec.ts",
      ],
      [
        "Zoom around the point you touch",
        "Pinch, wheel, a double tap and a click zoom in around the pointer or fingers, and a double tap, a click or the zoom button zooms back out to the whole photo. A pinch and a wheel follow the input at once, and the rest ease over the zoom duration from wherever the photo is. A single finger tap shows or hides the controls.",
        "tests/browser/lightbox-zoom.spec.ts",
      ],
      [
        "Keep focus inside and give it back",
        "The viewer is a native modal dialog, and closing it returns focus to the current photo's tile, or else to the element that opened it.",
      ],
      [
        "Leave the page as it was",
        "Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched, the abort listeners on your signals included. Back closes the viewer, and its one history entry leaves without a navigation, also when another viewer opened above it.",
        "tests/browser/lightbox-api.spec.ts",
      ],
      [
        "Behave like the platform's photo viewer",
        "Gestures, keys and timing match iOS Photos, macOS Photos and Google Photos unless a recorded decision says otherwise.",
        "tests/browser/lightbox-gestures.spec.ts",
      ],
      [
        "Dismiss like a photos app",
        "A vertical swipe carries the photo, fades the backdrop and the controls with it, and closes past a distance or a speed. A cancelled pointer never closes, a second finger leaves the swipe with the first, and a close ends the gesture.",
        "tests/browser/lightbox-gestures.spec.ts",
      ],
      [
        "Let the photo lead",
        "Controls fade in after the photo starts moving and leave before it. They hide while zoomed and after a still pointer, and a still pointer never hides them while one is hovered or keyboard-focused. While zoomed only close and zoom come back, focus on any other control, or on one a zoom stops rendering, moves to the photo, and the photo pans to the window's edges under the room the other controls kept.",
        "tests/browser/lightbox-gestures.spec.ts",
      ],
      [
        "Change the caption with the photo",
        "Each page fades the caption out while it rises 0.4em and fades the next one in as it rises from 0.4em below, over --re-lightbox-fade-duration, the other way when paging back, and swaps its text while it is hidden, so a caption of another height, or none, never jumps into view. A page during the fade goes on from the opacity and the shift on screen with the newest caption, the shift adds to a host's own translate, and reduced motion swaps it at once. The announcement of the settled photo reads its number and its caption once, through strings.slide(index, count, caption), so a translation sets the order and the separator.",
        "tests/browser/lightbox-controls.spec.ts",
      ],
      [
        "Return to what is on screen",
        "Close goes back to the current photo's tile, after bringing it into view in its own carousel, and fades in place when the tile cannot be seen, in the window and in every container that clips it. A close during a mouse drag or a fling ends it, puts the strip on the current photo at once and flies from where the photo was, with no neighbor in view. The page scrolls and takes clicks during the flight and stays where it was scrolled once the viewer is gone, focus moved there stays, the tile's container does not cut the photo before it nears the tile, and the landing photo never changes the size of a scroll area.",
        "tests/browser/lightbox-close.spec.ts",
      ],
      [
        "Fetch the pixels the screen shows",
        "Each image loads the source that fits the rendered size, a zoom asks for more, and the preview stays until the sharper file has decoded and no finger holds the photo. A photo without a size fits the screen at its tile's proportions from the start and eases to its file's size once the file decodes.",
        "tests/browser/lightbox-images.spec.ts",
      ],
      [
        "Roll the count with the page",
        "Every counter, the built-in one and each a slot takes from counter(), rolls a changed digit up when paging forward and down when paging back, and switches at once under reduced motion.",
        "tests/browser/lightbox-controls.spec.ts",
      ],
      [
        "Zoom to real pixels",
        "Zoom levels follow the image's own resolution. Panning stretches past the edge and glides on release.",
        "tests/browser/lightbox-zoom.spec.ts",
      ],
      [
        "Never block a frame",
        "No layout read or framework render runs per pointer move, scroll or wheel event.",
        "tests/browser/performance.spec.ts",
      ],
      [
        "Press like a native button",
        "A pressed control shrinks to --re-lightbox-press-scale, but a mouse press acts on release anywhere over the size it rests at, its outer edge included, and a release off it does nothing.",
        "tests/browser/lightbox-controls.spec.ts",
      ],
      [
        "Give focus back quietly",
        "A click or a tap opens with focus on the close button and no ring. Focus returns to the photo's tile without a ring after a pointer close, and with one after a keyboard close, unless the visitor moved it during the close flight.",
        "tests/browser/lightbox-close.spec.ts",
      ],
      [
        "Show every shape readably",
        "A long screenshot opens at the screen's width and scrolls, a panorama zooms to the screen's height, a transparent photo sits on its own backing, and an SVG takes the size its file declares.",
        "tests/browser/lightbox-media.spec.ts",
      ],
      [
        "Hand the photo to the system",
        "The photo is a real image: the browser's menu saves and copies it, and Cmd or Ctrl and C copies it. protect turns these off. A mouse drag on it pages like a finger, so saving stays on Download and the context menu.",
        "tests/browser/lightbox-native.spec.ts",
      ],
      [
        "Stay light in large galleries",
        "A thousand photos open as fast as ten. Slides outside the preload window are empty shells, the strip's positions are arithmetic, and the next photo in the direction of travel loads first.",
        "tests/browser/performance.spec.ts",
      ],
      [
        "Let a slideshow yield",
        "A slideshow waits while the photo is zoomed, a video or audio slide plays, an embed is on screen, the mouse is over the controls, the tab is hidden or a slot's menu is open, and goes on with the time it had left, or at once when the video or audio ends. From the last photo it returns to the first without showing the photos between.",
        "tests/browser/lightbox-controls.spec.ts",
      ],
      [
        "Play only the current slide",
        "Video, audio and embeds are optional modules. Leaving a slide pauses its player, close pauses them all at once, and over a player the pointer belongs to the player.",
        "tests/browser/lightbox-media-modules.spec.ts",
      ],
      [
        "Trust no page by default",
        "Items read from markup are untrusted. An embed plays only a known provider, every frame from another origin and every popup it opens is sandboxed, and Download offers only web, blob and raster data files and never navigates the tab away.",
        "tests/browser/lightbox-media-modules.spec.ts",
      ],
      [
        "Publish one state",
        "getState() returns the snapshot subscribers last received, so a gesture shows up once it settles, and a React component re-renders only for the part of it that it selects and hydrates from the state the lightbox was created with.",
        "packages/lightbox/src/lifecycle.test.ts",
      ],
      [
        "Take settings from markup or code",
        "A gallery reads JSON options from its markup under the options given in code, only while a photo from that gallery is open, and JSON it cannot read throws an error that names the element. A link is a trigger only when it holds an image or carries lightbox data, never a download link, and a trigger with no image file and no media type, or one clicked after the lightbox is destroyed, keeps its own click.",
        "packages/lightbox/src/lifecycle.test.ts",
      ],
      [
        "Survive every interruption",
        "Opening, closing, swiping, zooming, resizing, appending or destroying at any moment, or a callback that throws during open, leaves no dialog, timer, hidden tile, scroll lock or extra history entry behind.",
        "packages/lightbox/src/session.model.test.ts",
      ],
    ],
    api: [
      [
        "createLightbox(options?)",
        "Creates a viewer. Options include controls, thumbnails, caption, slideshow, content, autoplayMedia, loop, history, strings, slots, imageClick, doubleTapZoom, autoHide, maxZoom, protect, className and icons, copied at creation and changed with setOptions. The space around the photo is --re-lightbox-padding, any CSS length, 32px by default, and --re-lightbox-bottom-room keeps room below it for a page's own footer.",
      ],
      [
        "bindLightboxGallery(root, lightbox, options?)",
        'Opens the buttons, images and links that hold an image or carry data-lightbox-type or data-lightbox-src inside root in a lightbox you created, in page order, only those of the clicked trigger\'s data-lightbox-group or group(trigger), and returns the function that unbinds. lightboxItemFromElement reads each trigger: the file its link points to, else data-lightbox-src, with data-lightbox-srcset, -sizes, -width, -height and -type and its figure\'s caption, so a quick-view link without an image opens too. item(trigger) supplies the item instead, and null leaves the click to the page. data-lightbox-options on root holds JSON options, such as {"thumbnails":"bottom"}, that fill what the lightbox was not given in code while a photo from root is open. A second argument that is not a lightbox throws a TypeError.',
      ],
      [
        "open(items, index?)",
        "Opens at an index. Items carry src, srcset, sizes, alt, caption, the natural size and an optional origin, an element or a function that returns one.",
      ],
      [
        "close(), next(), prev(), goTo(index)",
        "Moves through the set from code. Close returns to the current photo's tile.",
      ],
      [
        "play(), pause()",
        "Starts and stops the slideshow of the open viewer, as its button does.",
      ],
      [
        "zoomTo(scale, focus?), toggleZoom(focus?)",
        "Zooms to a scale around a point, up to the photo's maximum, or between fit and the tap zoom.",
      ],
      [
        "getState(), subscribe(listener, { signal }?)",
        "Reads and listens to the index, the current item, canPrev, canNext, isPlaying, zoom, open, animation and controls state. getState() returns the snapshot subscribers last received, so a gesture shows up once it settles.",
      ],
      [
        "on(type, listener, { signal }?)",
        "Listens to open, opened, beforechange, change, settle, beforeclose and closed, until the returned function runs or the signal aborts. Only beforeclose carries preventDefault(), which keeps the viewer open.",
      ],
      [
        "append(items), setItems(items, index?)",
        "Adds images at the end or replaces the list while the viewer is open, without moving the current image. An empty list closes the viewer, and its beforeclose cannot be cancelled. During the close a list waits until the dialog is removed, and append() adds to the waiting list.",
      ],
      [
        "setOptions(options), getSlide(index)",
        "Changes any option but container for the next open, and loop and strings at once, and returns the element of a slide. createLightbox copies its options, so changing the object you passed does nothing.",
      ],
      ["destroy()", "Removes listeners and restores the page."],
      [
        "useLightbox(options?)",
        "React: a lightbox that is the same object on every render and holds no React state, so its component does not re-render when the viewer changes. Changed options reach it after the render, plain objects and arrays compared by value. Effect cleanup, on unmount, under StrictMode or when Activity hides the component, closes it at once and frees its dialog and listeners, and the same object opens again, so StrictMode and an Activity reveal keep one object.",
      ],
      [
        "useLightboxState(lightbox, selector)",
        "React: re-renders only when the value selector picks changes by Object.is, on the server and during hydration from the state at creation.",
      ],
    ],
    notes: [
      'A click on the image zooms by default, and a click beside it closes. On a phone a tap on the photo shows or hides the controls once the 300ms double-tap window passes, a double tap zooms, and a tap beside it closes. For a publishing gallery, set imageClick: "close", which also turns off the double tap.',
      "A vertical swipe either way closes past 120px or 0.5px/ms, measured over the last 80ms before the finger lifts. The controls hide after autoHide ms of a still mouse, 2500 by default, and while zoomed, and come back on a key, a 24px move, or a tap; while zoomed only close and zoom come back, and a drag shows the grabbing cursor. The open and close flights take --re-lightbox-open-duration and --re-lightbox-close-duration on the --re-lightbox-ease curve, a zoom by a button, a key, a click or a double tap --re-lightbox-zoom-duration (350ms) on the same curve, while a pinch and a wheel follow the input at once, and a fade to a distant photo --re-lightbox-fade-duration (240ms); 0ms makes each instant.",
      "Zoom follows the file's pixels: a double tap, a click or the zoom button goes to 1:1, or to tapZoom (2.5) when that is larger, and maxZoom (1) is a multiple of 1:1. A photo the screen already shows at full resolution has no zoom, and an SVG zooms up to maxZoom times its fitted size, 4 by default. A pinch below 0.75 closes, Ctrl or Cmd with the wheel and a trackpad pinch zoom, and a plain wheel does nothing until you zoom in, then pans. While zoomed the arrow keys pan and a pan glides on release; the next photo is a second swipe once the photo rests against its edge.",
      "A photo more than twice as tall as it is wide that would run past two screens at the screen's width opens at that width, top first, and scrolls; a swipe down closes it only from its top edge, and a double tap shows its whole height. A photo more than three times as wide as it is tall opens whole and zooms to the screen's height on a double tap. PNG, WebP, AVIF, GIF and SVG photos sit on --re-lightbox-media-background, #f2f2f2 in the default theme; JPEG gets none. An SVG takes its size from its own width and height, else its viewBox.",
      "The photo is a real img: right click and a long press open the browser's image menu, a mouse drag on it pages like a swipe, and Cmd or Ctrl and C copies it as PNG where the browser supports image copy. protect: true turns off the menu and the copy. A swipe that passes the closing distance taps the vibration motor once where the device has one.",
      'Built-in controls: the counter sits top left before the toolbarStart slot, and zoom, slideshow, fullscreen, download, the toolbarEnd slot and close sit top right; the arrows sit at the sides, previous on the right and next on the left with mirrored icons on a right-to-left page, a slot\'s icon("previous") and icon("next") too, and hide below 480px. controls turns each one on or off, and fullscreen, download and slideshow start off. Each built-in control draws a 24px SVG icon in currentColor, zoom, slideshow and fullscreen switching theirs with their state, and icons replaces any of them by key, zoomOut, slideshowPause and fullscreenExit for the second state. A slot\'s icon(name) returns the same icons. Fullscreen covers the viewer\'s stage, since browsers refuse a dialog, and is missing where document.fullscreenEnabled is false. Download links the widest srcset candidate, else src, only when it is an http, https or blob URL or a PNG, JPEG, GIF, WebP or AVIF data URL; a web file, same-origin included, is fetched when the button is pressed and saved under its Content-Disposition name when the page can read it, else its decoded name, or opens in a new tab when its server refuses scripts. thumbnails: "bottom" is a carousel strip that keeps the current thumbnail centered, crops thumbnails wider than 3:1, and takes one Tab stop whose arrow, Home and End keys page the viewer; "side" is a column at the end edge that becomes the strip below 720px, the photo fits above the strip and before the column, and both hide below 480px of height. thumbnailsVisible and setOptions hide or show the configured thumbnails while the viewer remains open and on the same photo. caption: "side" moves captions into the aside panel. The slideshow advances every slideshow.interval ms, 4000 by default, waits while a video or audio slide plays and on an embed until the visitor pages, returns to the first photo at the end without loop the way a jump does, and publishes --re-lightbox-slideshow-progress from 0 to 1.',
      "Paging runs on the carousel package. Only the current and neighboring images stay loaded. Next and previous scroll smoothly, and a jump to a distant thumbnail pages in like the next photo, so the photos between never flash past.",
      "Give an item a srcset and the viewer picks the file: it sets sizes to the photo's shown width, or uses yours, and 150ms after a zoom comes to rest asks for the zoomed width, swapping the file in only once it has decoded and never for a smaller one. While the photo flies open it shows the tile's loaded pixels or previewSrc. The current photo loads at high fetch priority and its neighbors at low priority once it has decoded, and Save-Data skips the neighbors. A photo still loading after 300ms shows a spinner from @reuse-sh/loaders over the --re-lightbox-placeholder background, and a failed one shows strings.error with a strings.retry button.",
      'Images are the core. Video, audio, iframe and HTML slides are separate modules: @reuse-sh/lightbox/video, /audio, /iframe, /html and /embed export video(), audio(), iframe(), html() and embed(), which you pass in the content option. An item picks its module by type; without one it is an image. The embed module turns YouTube (youtube-nocookie.com, Shorts at 9:16) and Vimeo links into players and embed({ providers }) adds more for that module only; any other URL stays blank. Items read from markup are untrusted, so every iframe() and embed() frame from another origin, providers passed to embed() included, gets sandbox "allow-scripts allow-same-origin allow-forms allow-presentation allow-popups", which its popups keep, and a same-origin page loads as it is; the sandbox option replaces the default. A same-origin URL is trusted, so an open redirect on your own site defeats the sandbox. Only the current slide plays: leaving it pauses the player, close pauses every one, and a player starts by itself only the first time it shows, when autoplayMedia is on and a click opened the viewer, muted if the browser refuses sound. Over a player the pointer belongs to the player, and paging works from the 24px beside it and the arrows. HTML slides take a function that returns a Node, never an HTML string. Live Photos and HDR are not supported.',
      'For a page without a bundler or an import map, such as a theme or a plugin, load @reuse-sh/lightbox/browser/lightbox.js with <script type="module">. It is one minified ES module with a source map and the carousel inside. Each media module is a separate file in the same folder, audio.js loads video.js and embed.js loads iframe.js, and the carousel link is carousel-link.js beside them, so copy the folder whole.',
      "Styles come in two files: base.css holds the layout and states in @layer re.base and is required, and theme.css holds the default dark theme in @layer re.theme, in --re-lightbox-font, system-ui by default, so a page without its own font gets no serif. themes/dark.css, light.css, page.css and photos.css load after theme.css and change only its custom properties: page follows --re-lightbox-page, and photos is white with a black room while the controls are hidden. Every theme value is a --re-lightbox-* custom property. dist/unlayered/ holds the same files without layers for sites whose own unlayered styles would win.",
      "Every visible and spoken text comes from the strings option, such as counter(index, count), slide(index, count, caption), the announcement of the settled photo, close and carouselRole, the screen reader description of the photo strip, with English defaults, so a translation passes only the strings it changes.",
      "Slots add your own controls: toolbarStart, toolbarEnd, footer and aside each take a function that returns a node with optional update(state) and destroy(). Slot buttons take the theme's look with the re-lightbox-button class and hide with the other controls. A slot's counter() returns a counter that shows the position and rolls its digits like the built-in one, so a custom toolbar or panel places the count where it wants. Share is not built in; build it as a slot.",
      "Events: on(type, listener, { signal }) reports open, opened, beforechange, change, settle, beforeclose and closed. beforechange exposes the incoming index before the active slide changes. beforeclose runs before the close flight is measured, and its preventDefault() keeps the viewer open; the other events cannot be cancelled. subscribe(listener, { signal }) reports the state, and there is no onChange option.",
      "connectCarousel(lightbox, carousel, { slideOf }) from @reuse-sh/lightbox/carousel moves a carousel on the page to the current photo on every settle and before close, and holds its autoplay while the viewer is open, so close returns to a tile that is already in view.",
    ],
    pages: [
      { path: "", title: "Overview", lead: lightboxDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then bind the viewer to the element that holds your images.",
      },
      {
        path: "themes",
        title: "Themes",
        lead: "Four themes for the room and the controls, each a stylesheet of custom properties, and four looks built from a theme, slots and options.",
      },
      {
        path: "gestures",
        title: "Gestures",
        lead: "What each gesture and key does in the lightbox, beside iOS Photos, macOS Photos and Google Photos.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/product",
            title: "Product page",
            lead: "A marble art print with its detail shots. The main image and the thumbnails open as one set.",
            build: "a product page gallery",
          },
          {
            path: "examples/chat",
            title: "Chat thread",
            lead: "Prints shared in a conversation. Each message pages through its own images.",
            build:
              "a chat thread where each message pages through its own images",
          },
          {
            path: "examples/journal",
            title: "Journal",
            lead: "A short essay about a print series. Every image opens in one sequence, shown whole whatever its crop.",
            build: "a journal where every image opens in one sequence",
          },
          {
            path: "examples/carousel",
            title: "Carousel with lightbox",
            lead: "A strip of photos that opens in the viewer. Once the viewer rests on another photo, the strip moves to it, so a close flies back into that photo's own tile.",
            build:
              "a photo carousel that opens in a lightbox and follows the photo shown",
          },
          {
            path: "examples/album",
            title: "Album in a conversation",
            lead: "A conversation with an album of seven photos shown as four tiles. One viewer pages through every photo in the thread, and a photo without a tile closes into the +3 tile.",
            build:
              "a conversation where every photo opens in one sequence and an album shows four tiles",
          },
          {
            path: "examples/device-check",
            title: "Device check",
            lead: "A checklist for trying the lightbox by hand on an iPhone, an Android phone and a Mac, with the examples to open.",
          },
        ],
      },
      {
        title: "Control styles",
        pages: [
          {
            path: "controls/minimal",
            title: "Minimal",
            lead: "Only a close button. Swipe, drag or press the arrow keys to move, and Escape to leave.",
          },
          {
            path: "controls/classic",
            title: "Classic",
            lead: "Side arrows, a counter in the corner, and the caption under the image.",
          },
          {
            path: "controls/filmstrip",
            title: "Filmstrip",
            lead: "Thumbnails along the bottom edge. The ring in the middle marks the open photo, and dragging the strip pages through them.",
          },
          {
            path: "controls/panel",
            title: "Panel",
            lead: "Caption and details in a side panel, which moves under the image on narrow screens.",
          },
          {
            path: "controls/immersive",
            title: "Immersive",
            lead: "A dark room for the image. The controls fade after two seconds and return on any movement.",
          },
          {
            path: "controls/toolbar",
            title: "Toolbar",
            lead: "Paging, the counter and zoom in one floating toolbar, as in a photos app.",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/media",
            title: "Media",
            lead: "Supported images, full-size assets, previews, dimensions and captions.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createLightbox and bindLightboxGallery. @reuse-sh/lightbox/react adds useLightbox, which returns the same viewer, and useLightboxState, which reads part of its state.",
      },
    ],
  },
  {
    slug: "carousel",
    name: "Carousel",
    description: carouselDescription,
    packageName: "@reuse-sh/carousel",
    principles: [
      [
        "Let the browser scroll",
        "Touch and trackpads scroll natively with CSS scroll snap, and every move from code is a scroll too.",
      ],
      [
        "Never let a drag click",
        "A mouse drag, or the mouse press that stops a moving strip, never opens the link under it. A thumbnail strip from connectThumbnails lets that press click its thumbnail, like a pagination button. An ordinary click still works, and touch stays native.",
        "tests/browser/carousel.spec.ts",
      ],
      [
        "Drag like a trackpad",
        "A released mouse drag goes to the slide nearest where its speed would carry it, never past a slide that asks to stop, and a flick on a snapped strip settles there as fast as next(). A strip that does not snap there, with scroll-snap-type none or proximity away from a snap point, glides on with the drag's own momentum to the stop itself. Past either end it stretches and springs back.",
        "tests/browser/carousel-motion.spec.ts",
      ],
      [
        "Keep the slide it was sent to",
        "When the last slides share one scroll position, the active index stays the slide that goTo, a dot or a lightbox chose.",
      ],
      [
        "Repeat without clones",
        "The loop moves the original slides through a CSS variable, so ids, links, buttons and each slide's own transform stay as they are, and it turns on only when every slide has a width and the slides can cover the viewport.",
        "tests/browser/carousel-effects.spec.ts",
      ],
      [
        "Let autoplay wait for people",
        "Autoplay pauses for hover, keyboard focus, dragging, hidden pages, strips less than half in view and reduced motion, keeps the rest of its wait, and stays paused after the visitor pauses it. Focus from a mouse click, or returned by a lightbox closed with a pointer, does not pause it.",
        "tests/browser/carousel-controls.spec.ts",
      ],
      [
        "Keep keys local",
        "Arrow keys act only inside the focused strip and swap sides in right-to-left layouts.",
      ],
      [
        "Put back what it moved",
        "Destroy cancels timers and restores the styles, transforms and listeners it added.",
      ],
      [
        "Move the same way every time",
        "Next, dots, goTo and a released drag use one motion, so browsers do not differ.",
        "tests/browser/carousel-motion.spec.ts",
      ],
      [
        "Hold hover while the strip moves",
        "Slides ignore hover during a fast swipe or wheel scroll and respond again once it slows down.",
        "tests/browser/carousel-motion.spec.ts",
      ],
      [
        "Land the slider with the strip",
        "A click on the progress slider moves its handle with the strip, never to the pointer and back. A released drag eases the handle from the pointer to where the strip comes to rest, and under reduced motion it lands there at once.",
        "tests/browser/carousel-controls.spec.ts",
      ],
      [
        "Publish one state",
        "Index, pages, visible slides and autoplay progress come from one source that every control reads, and every label and announcement from the carousel's strings.",
        "tests/browser/carousel-controls.spec.ts",
      ],
      [
        "Swipe by the group the buttons use",
        "With group set, only the first slide of each group and the slide a move was sent to snap, so a swipe and a released drag move a group like next() does.",
        "tests/browser/carousel-effects.spec.ts",
      ],
      [
        "Give the strip back to the visitor",
        "A drag or a touch takes the position from a driver such as a marquee, and the strip snaps again once the driver lets go.",
        "tests/browser/carousel-effects.spec.ts",
      ],
      [
        "Let the markup carry the options",
        "Options printed in data-carousel-options apply under the options from code, key by key, and an attribute that is not a JSON object, or a key whose JSON type does not match its option, stops with the element's name and the key before the DOM changes instead of a strip with defaults.",
        "packages/carousel/src/index.test.ts",
      ],
      [
        "Re-render only what reads the change",
        "A React component re-renders for the part of the state it selects, so autoplay progress and scrolling leave a counter that shows the index alone, and a changed option reaches the same carousel instead of a new one.",
        "packages/carousel/src/react.test.tsx",
      ],
    ],
    api: [
      [
        "createCarousel(viewport, options?)",
        "Binds a scroll-snap strip. Options: slides, align, loop, drag, group, autoplay, moveMotion, releaseMotion, releaseDuration, wheel, strings.",
      ],
      [
        "setOptions(options)",
        "Changes any option except slides without rebuilding the strip, such as autoplay, loop, group, align, drag, motion, wheel or strings. The active slide stays in place. A key set to undefined returns to its value from data-carousel-options, else the default. strings merge over the current strings key by key, and a string set to undefined returns the same way.",
      ],
      [
        "moveMotion",
        'How next, prev, goTo, the arrow keys, Home and End travel. "spring" uses the same spring as a released drag and settles in 500ms; a move during a move redirects it and keeps its speed. "native" uses the browser\'s smooth scroll. "spring" by default; goTo(index, "instant") and reduced motion jump.',
      ],
      [
        "releaseMotion",
        'How a released mouse drag travels to its slide. "spring" starts at the drag speed and decays like trackpad momentum; "native" uses the browser\'s smooth scroll. Both pick the same slide: the one nearest where the drag would stop. "spring" by default; reduced motion jumps.',
      ],
      [
        "releaseDuration",
        "How long the spring takes to settle a release or a stretched end on a snapped strip, flicks included, in milliseconds. 260 by default. A free glide, with scroll-snap-type none or proximity away from a snap point, carries the drag's own momentum instead.",
      ],
      [
        "next(), prev(), goTo(index, behavior?)",
        "Moves by one group or to a slide. goTo takes an optional scroll behavior.",
      ],
      [
        "getState(), subscribe(listener)",
        "Index, count, progress, pageCount, pageIndex, pages (the slide each page starts at), the visible slides, autoplayProgress, seamSlides, canPrev, canNext, whether it is playing, dragging or looping, and isPaused, the visitor's own pause of autoplay, false without autoplay, which holds and hover leave alone.",
      ],
      [
        "subscribe(listener, { signal }), on(type, listener, { signal })",
        "subscribe calls the listener with every new state. on listens for change, settle, play or pause and passes { state }. Both return a function that removes the listener, and aborting the signal removes it too.",
      ],
      [
        "take(owner, { onInterrupt })",
        "Hands the position to your own driver, such as a marquee. Returns setPosition(px) and release().",
      ],
      [
        "play(), pause()",
        "Starts and stops autoplay. It also waits for hover, keyboard focus, drag, hidden tabs and a strip less than half in view on its own, and returns to the first slide after the last one.",
      ],
      [
        "setEnabled(enabled)",
        "Turns scrolling and dragging off and back on, keeping the current position.",
      ],
      [
        "wheel",
        '"vertical" turns each notch of a vertical mouse wheel into one slide and lets the page scroll once the strip cannot move further. Trackpads stay native. Off by default.',
      ],
      [
        "refresh()",
        "Measures again at once. Resizes and added or removed slides request it on their own, at most once a frame.",
      ],
      ["destroy()", "Removes listeners and restores the viewport."],
      [
        "useCarousel(options), useCarouselState(carousel, selector)",
        "From @reuse-sh/carousel/react. useCarousel returns { ref, carousel } and applies changed options with setOptions; a change of slides creates the carousel again, and an option it drops returns to the markup value or the default. It compares strings field by field and function strings such as goTo by identity, so memoize them or define them outside the component. useCarouselState re-renders only when what the selector returns changes, compared field by field for an object, and selects from the empty state on the server and before the carousel exists.",
      ],
      [
        "syncCarousels(...carousels)",
        "Keeps several carousels on the same index. Returns a function that stops it.",
      ],
      [
        "connectThumbnails(main, thumbnails)",
        "Centers the active thumbnail, marks it with aria-current and moves the main strip to a clicked thumbnail. Returns a function that stops it.",
      ],
      [
        "bindCarouselControls(root, carousel, options?)",
        "From @reuse-sh/carousel/controls. Wires prev, next, dots, counter, play and progress markup to the strip. Returns a function that removes everything it added.",
      ],
    ],
    notes: [
      "The loop needs enough slides to cover the viewport plus the widest slide, and every slide needs a width. With fewer, or while an image has not given its slide a width yet, isLooping is false and the strip scrolls normally.",
      "That check runs again after a resize or a content change. Slides added at the end, such as a Load More, leave the active slide where it was.",
      "The loop draws a slide in another period through --re-carousel-shift, which the package CSS applies as translate, and marks the period in data-re-cycle (-1, 0 or 1). It never writes a slide's own transform, so put an effect on transform. A translate of your own replaces the shift on a moved slide unless it adds var(--re-carousel-shift, 0px), and a drag past the end of a strip that does not loop stretches it through translate.",
      "Every slide carries --re-carousel-offset: its distance from where it would rest aligned, in slide widths. It is 0 for a slide resting where it aligns, which is the active slide except at the ends of a strip that does not loop, negative before it and positive after it in the reading direction, the same for a slide the loop moved, and it changes every frame while the strip moves.",
      "A scroll-driven animation on a slide follows its layout position, so on a looping strip add --re-carousel-shift to the timeline range or read --re-carousel-offset instead.",
      'With group: 3 or group: "page", only the first slide of each group, and the slide a move was sent to, keeps scroll-snap-align, so touch and trackpad swipes move a group like the buttons. The others get scroll-snap-align: none, and destroy gives back their own value.',
      'state.seamSlides lists the slides a looping strip shows while it crosses the seam: the first slides and the last slides that each fill one viewport width. When the server renders the strip, give the images in those slides loading="eager" and leave the rest lazy, so crossing the seam never shows an image that is still loading.',
      'To let the first and last slides of a centered strip reach the middle without a loop, set align: "center" and give the viewport padding-inline and scroll-padding-inline of half the difference between the viewport and a slide, such as #prints { --re-carousel-slide-width: 320px; padding-inline: calc(50% - 160px); scroll-padding-inline: calc(50% - 160px); } for a viewport as wide as its parent.',
      "The viewport carries data-re-dragging during a mouse drag, data-re-scrolling during a fast swipe or wheel scroll, data-re-static when nothing overflows, and data-re-at-start and data-re-at-end at the edges of a strip that does not loop. The package CSS turns off hover on the slides while data-re-scrolling is set. bindCarouselControls marks the prev, next and dots it binds with data-re-static while their strip is static, and the package CSS hides those, in place or in a data-carousel-controls group. The package CSS hides no control it did not bind: a page that writes its own arrows hides them with a rule on the viewport's attribute, such as .gallery:has(> [data-re-static]) .arrows { display: none }.",
      "Set --re-carousel-press-scale, such as 0.96, and the slides shrink to it while a mouse drags the strip, over --re-carousel-press-duration (300ms). Without it the slides keep their size.",
      "scroll-snap-type on the viewport sets how a released drag ends: mandatory snaps, proximity snaps only near a snap point, and none glides to a stop.",
      "A mouse drag inside a nested strip that can scroll moves only that strip.",
      "Autoplay pauses for hover, keyboard focus (:focus-visible), dragging, hidden pages, strips less than half in view and reduced motion, and picks up the rest of its wait when it resumes. --re-carousel-autoplay-progress on the viewport fills from 0 to 1 over the wait, every frame.",
      'For a page without a bundler or an import map, such as a theme or a plugin, load @reuse-sh/carousel/browser/carousel.js with <script type="module">. It is one minified ES module with a source map and no imports. The controls entry is controls.js in the same folder, also with no imports.',
      'data-carousel-options on the viewport holds a JSON object of options, such as data-carousel-options=\'{"loop":true,"autoplay":5000}\', for a theme or a plugin that prints its settings with the markup. Options passed in code win key by key and strings merge. An attribute that is not a JSON object, an unknown key or a value of the wrong JSON type ("loop":"false", "align":"end") throws a TypeError that names the element and the key before the DOM changes. Strings that are functions, such as goTo and slide, come from code.',
      "bindCarouselControls(root, carousel, { dotsWindow }) from @reuse-sh/carousel/controls wires your own markup: [data-carousel-prev], [data-carousel-next], [data-carousel-dots], [data-carousel-counter], [data-carousel-play] and [data-carousel-progress], also outside root with data-carousel-controls set to the viewport id. It reads pages, pageIndex, isPaused and autoplayProgress from the one state and its labels from the carousel's strings, so setOptions({ strings }) renames them, and the function it returns removes every listener and element it added.",
      "The strings option supplies every label and announcement, such as goTo(index, count) and slide(index, count), with English defaults. carousel.on(type, listener, { signal }) reports change, settle, play and pause with { state }, and the viewport dispatches the same events as re-carousel:change, re-carousel:settle, re-carousel:play and re-carousel:pause with the state in detail, for markup and scripts that hold no controller.",
      "A div or span viewport without a role becomes a region described by strings.carouselRole, and div or span slides without one become groups described by strings.slideRole and labeled from strings.slide, such as 3 of 8. next(), prev(), the arrows, dots and keys announce the slide they reach; autoplay and swipes stay quiet.",
      "A goTo while the strip cannot scroll yet, such as in a hidden tab or before its images load, waits for the first refresh that finds overflow and lands there at once.",
      "connectThumbnails(main, thumbnails) keeps the active thumbnail in view and centered, marks it with aria-current and moves the main strip when a thumbnail is clicked.",
      "take(owner, { onInterrupt }) hands the position to your own driver, such as a marquee: setPosition(px) places the strip px from where it was taken and wraps through the loop seam, snapping, autoplay and moves from code stop meanwhile, a drag or a touch takes it back and calls onInterrupt, and release() glides to the nearest snap point and restores snapping. Take again on the next re-carousel:settle. Under reduced motion setPosition does nothing.",
    ],
    pages: [
      { path: "", title: "Overview", lead: carouselDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, mark the slides, and bind the strip. Your slides stay your own elements.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/product-strip",
            title: "Product strip",
            lead: "More prints from the series, a page at a time. The arrows know when there is nothing left to show.",
            build: "a product strip whose arrows know when the strip ends",
          },
          {
            path: "examples/editorial",
            title: "Editorial gallery",
            lead: "A series of prints at a readable size, one after another. On an article page the strip starts at the text column and runs off the edge.",
            build: "an editorial gallery that starts at the text column",
          },
          {
            path: "examples/press-to-grab",
            title: "Press to grab",
            lead: "A strip of prints that shrinks a little while a mouse drags it, so the press reads as picking the strip up. Touch and trackpads scroll as usual.",
            build:
              "a carousel whose slides shrink slightly while a mouse drags it",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/controls",
            title: "Controls",
            lead: "Arrows, dots and counters around the strip, in a few styles. Switch between them and move the strip.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createCarousel. The React package adds useCarousel, useCarouselState and a Carousel component.",
      },
    ],
  },
  {
    slug: "annotations",
    name: "Annotations",
    description: annotationsDescription,
    packageName: "@reuse-sh/annotations",
    principles: [
      [
        "Store one versioned format",
        "Annotations live in one version 1 JSON document, and an unknown version throws instead of being guessed.",
      ],
      [
        "Place marks in percent",
        "Coordinates are percentages of the image, so every mark keeps its place at any size.",
      ],
      [
        "Check input at the edge",
        "Parsing clamps coordinates, drops invalid marks, and escapes marker text except strong, em and code.",
      ],
      [
        "Render without a browser",
        "The same document renders to HTML on the server, with no DOM needed.",
      ],
      [
        "Leave storage to the host",
        "The editor reports every change through onChange, and your code decides where the document goes.",
      ],
      [
        "Edit from the keyboard",
        "Marks can be created, selected, moved and deleted with keys, and one drag is one undo step.",
      ],
      [
        "Edit the mark itself",
        "A selected area or line gets handles on its own corners and ends, with no second frame around it, and a drag redraws the mark as it moves.",
      ],
    ],
    api: [
      [
        "parseAnnotations(value)",
        "Reads a version 1 document, its JSON string, or a bare array. Invalid annotations are dropped. An unknown version throws.",
      ],
      ["serializeAnnotations(value)", "Writes the version 1 JSON document."],
      [
        "annotationsToHtml(value), annotationsFromHtml(element)",
        "Writes the annotations as an ordered list in HTML, and reads them back from it.",
      ],
      [
        "renderAnnotations(value, { ratio, id })",
        "Returns the overlay markup for an image ratio and a unique id, for server rendering.",
      ],
      [
        "createAnnotatedImage(root, options)",
        "Renders an image with its annotations and keeps them placed on resize. Returns update and destroy.",
      ],
      [
        "createAnnotationEditor(root, { annotations, onChange, tool?, onPreview?, onSelectionChange?, onToolChange? })",
        "A controlled editor. It reports every change through onChange and leaves storage to you. onPreview reports the marks while a drag reshapes them and null when it ends, so the image can draw them as they move.",
      ],
      [
        "setAnnotations, setTool, updateSelection, removeSelection, undo, redo, destroy",
        "The editor's methods. The keyboard reaches the same actions.",
      ],
      [
        "AnnotatedImage, AnnotationEditor",
        "The React components around the same code. The editor adds a toolbar and a label field.",
      ],
    ],
    notes: [
      "The stored document is { version: 1, annotations: [...] }. A bare array of annotations is also accepted.",
      "Marker text may hold strong, em and code. Everything else is escaped when it is read.",
      "On a narrow image, pointer labels turn into numbered markers with a list below.",
    ],
    pages: [
      { path: "", title: "Overview", lead: annotationsDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then render an image with its marks or open it in the editor.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/review-notes",
            title: "Review notes",
            lead: "Feedback on a print proof, with all six kinds of mark. Read-only, as a reviewer would send it.",
            build: "read-only review notes on an image",
          },
          {
            path: "examples/editor",
            title: "Editor",
            lead: "Draw a mark, move it, change your mind. The page holds the annotations and the editor reports each change.",
            build: "an annotation editor that reports every change",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/data-format",
            title: "Data format",
            lead: "One versioned JSON document, with coordinates in percent. It travels as HTML too, and bad input fails in a known way.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module parses, renders and edits one annotation format. The React package wraps the image and the editor.",
      },
    ],
  },
  {
    slug: "justified-gallery",
    name: "Justified gallery",
    description: justifiedDescription,
    packageName: "@reuse-sh/gallery",
    principles: [
      [
        "Rows fill the width",
        "Every full row ends at the container's edge at any width, and no item reaches past it.",
      ],
      [
        "Proportions are kept",
        "A picture is never cropped or stretched; one row's pictures share one height.",
      ],
      [
        "The row height is the picture's",
        "A caption under a picture does not change breaks or picture height.",
      ],
      [
        "Works before the script",
        "Server-rendered markup with ratios already lays out in rows.",
      ],
      [
        "A resize keeps rows while they fit",
        "Breaks change only when a row leaves the height range, so a scrollbar appearing does not move pictures.",
      ],
      [
        "A resize paints the new layout",
        "When the browser resizes the window, the layout for the new width lands in that frame, before it paints. When your script changes the width, call refresh() in the same frame. Any other size change lays out on the next frame.",
      ],
      ["Hidden keeps its layout", "Width 0 never lays out."],
      [
        "Destroy puts back what it wrote",
        "Destroy disconnects its observers and restores every custom property, attribute and inline style it wrote.",
      ],
    ],
    api: [
      [
        "createJustifiedGallery(container, options?)",
        "Lays out the children of a re-justified container in rows. Returns refresh and destroy.",
      ],
      [
        "tolerance",
        "How far a full row may settle from the target height, as a fraction of it. 0.25 by default.",
      ],
      [
        "lastRow",
        '"start", "center", "end", "justify" or "hide" for the last row that is not full. "start" by default, and "hide" never hides the only row.',
      ],
      [
        "maxRows",
        "Hides every row after this count. 0, every row, by default.",
      ],
      [
        "refresh()",
        "Reads the items, their proportions and the sizes again and lays out from scratch.",
      ],
      [
        "destroy()",
        "Disconnects the observers and restores what the controller wrote. Calling it twice is harmless.",
      ],
      [
        "--re-ratio",
        "An item's width divided by its height. It wins over the size of the image itself.",
      ],
      [
        "--re-justified-row-height",
        "The target row height. 240px by default, and a media query may change it.",
      ],
      [
        "--re-justified-gap",
        "The gap between pictures in a row. 8px by default.",
      ],
      [
        "--re-justified-row-gap",
        "The gap between rows. The same as the column gap by default.",
      ],
      [
        "re-justified-media",
        "Marks the picture inside a wrapper such as a figure, so a caption after it stays out of the row height.",
      ],
      [
        "JustifiedGallery, useJustifiedGallery(options)",
        "The React component and hook around the same controller. The component takes options and onReady.",
      ],
    ],
    notes: [
      "Give every image its width and height attributes or a --re-ratio. Without them the layout shifts when the image loads.",
      "The controller writes custom properties and data-re-justified attributes on the container and its items, and removes them on destroy.",
      "Items hidden by the page with display: none are left out of the rows. Adding, removing or reordering items lays out again.",
    ],
    pages: [
      { path: "", title: "Overview", lead: justifiedDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then lay out the pictures already in your markup.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/captions",
            title: "Captions",
            lead: "Each print with its title and a line under it. Captions of any length leave the picture rows as they are.",
            build: "a justified gallery with captions under the pictures",
          },
          {
            path: "examples/lightbox",
            title: "Lightbox",
            lead: "Every picture opens in the lightbox, in gallery order, and closes back into its place in the row.",
            build: "a justified gallery that opens in a lightbox",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createJustifiedGallery. The React package adds JustifiedGallery and useJustifiedGallery.",
      },
    ],
  },
  {
    slug: "masonry",
    name: "Masonry",
    description: masonryDescription,
    packageName: "@reuse-sh/gallery",
    principles: [
      [
        "The platform lays out first",
        "Where display: grid-lanes exists, script writes nothing.",
      ],
      [
        "The fallback places like the platform",
        "Same CSS, same lanes and offsets as css-grid-3 §4.4, for spans that fit the columns.",
      ],
      ["Columns and gaps are CSS", "One stylesheet drives both paths."],
      ["DOM order is reading order", "Items are never moved in the document."],
      [
        "A resize paints the new layout",
        "When the browser resizes the window, the layout for the new width lands in that frame, before it paints. When your script changes the width, call refresh() in the same frame. Any other size change lays out on the next frame.",
      ],
      ["Hidden keeps its layout", "Width 0 never lays out."],
      [
        "Destroy puts back what it wrote",
        "Destroy disconnects its observers and restores every inline style and attribute it wrote.",
      ],
    ],
    api: [
      [
        "createMasonry(container)",
        "Stacks the children of a re-masonry container into columns. Returns native, refresh and destroy.",
      ],
      [
        "native",
        "True when the browser lays the items out with display: grid-lanes and the controller writes nothing.",
      ],
      [
        "refresh()",
        "Measures the items again and places them. Does nothing when native.",
      ],
      [
        "destroy()",
        "Disconnects the observers and restores what the fallback wrote. Calling it twice is harmless.",
      ],
      [
        "--re-masonry-columns",
        "The number of equal columns. 3 by default. A page may set its own grid-template-columns instead.",
      ],
      ["--re-masonry-gap", "The gap between columns. 8px by default."],
      [
        "--re-masonry-row-gap",
        "The gap between items in a column. The same as the column gap by default.",
      ],
      [
        "--re-masonry-tolerance",
        "How close to the shortest column a column must be to take the next item in order: normal (1em, the default), infinite, or a length.",
      ],
      [
        "grid-column: span N",
        "Lets an item span several columns, natively and in the fallback.",
      ],
      [
        "Masonry, useMasonry()",
        "The React component and hook around the same controller. The component takes onReady.",
      ],
    ],
    notes: [
      "Where the browser supports display: grid-lanes, the stylesheet uses it and the controller writes nothing. That is Safari 26.4 and later today.",
      "Elsewhere the fallback writes grid-column and margin-top on each item and keeps every item in grid row 1, so column widths, gaps and right-to-left stay CSS.",
      "Give images their width and height attributes, so a column does not shift when they load. The fallback places the items again whenever one changes height.",
      "Keep a span within the column count, for example with a container query. Natively a wider span adds a column past the container's edge; the fallback narrows it to every column instead.",
    ],
    pages: [
      { path: "", title: "Overview", lead: masonryDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then stack the cards already in your markup.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/spans",
            title: "Spans",
            lead: "As many columns as fit, and one featured card that spans two of them.",
            build: "a masonry grid with a featured card that spans two columns",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createMasonry. The React package adds Masonry and useMasonry.",
      },
    ],
  },
  {
    slug: "loaders",
    name: "Loaders",
    description: loadersDescription,
    packageName: "@reuse-sh/loaders",
    principles: [
      [
        "Show a static figure first",
        "Server-rendered markup keeps visible dots until the canvas has painted successfully.",
      ],
      [
        "Move dots, not frames",
        "Between figures each dot travels to its new place instead of popping.",
      ],
      [
        "Show every figure in turn",
        "The default sequence shows each figure once per round and never the same one twice running.",
      ],
      [
        "Draw in the text color",
        "The canvas takes its color from the surrounding text, so it fits any theme.",
      ],
      [
        "Stop when unseen",
        "The clock pauses offscreen and in hidden tabs, and reduced motion shows a still figure.",
      ],
      [
        "Stay silent unless labeled",
        "The dots are decorative, and a label turns them into a status for screen readers.",
      ],
      [
        "Give the canvas back",
        "Destroy stops the clock and restores the canvas.",
      ],
    ],
    api: [
      [
        "createThinkingDots(canvas, options?)",
        "Draws the dots on a canvas in its text color. Options: size, config and seed.",
      ],
      [
        "play(), pause(), setConfig(config), destroy()",
        "Controls the animation and swaps the figure or sequence.",
      ],
      [
        "figureConfig(name), figureNames",
        "A config that repeats one figure, and the list of figure names.",
      ],
      [
        "THINKING_DOTS",
        "The default config, which moves through every figure.",
      ],
      [
        "createTimeline(config, seed), sampleDot(timeline, dot, time)",
        "The timeline and sampler the canvas uses, for your own renderer.",
      ],
      [
        "ThinkingDots",
        "The React component. Pass a label to announce it as a status.",
      ],
    ],
    notes: [
      "The default sequence moves through every figure. figureConfig repeats one.",
      "ThinkingDots is decorative unless you pass a label, which makes it a status for screen readers.",
      "Pick a figure or write the sequence in code. There is nothing to configure elsewhere.",
    ],
    pages: [
      { path: "", title: "Overview", lead: loadersDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, then draw the dots on a canvas, or drop in the React component.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/chat-reply",
            title: "Chat reply",
            lead: "The dots hold the reply's place in the thread until its text arrives.",
            build: "a chat reply that shows the dots until its text arrives",
          },
          {
            path: "examples/figures",
            title: "Figures",
            lead: "All sixteen figures, each on repeat. Pass a name to figureConfig to use one.",
            build: "a gallery of the loader figures",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createThinkingDots and its timeline. The React package adds ThinkingDots.",
      },
    ],
  },
  {
    slug: "shadows",
    name: "Shadows",
    description: shadowsDescription,
    packageName: "@reuse-sh/shadows",
    principles: [
      [
        "Build each level from two layers",
        "Every level is a close shadow and a wide one, drawn from one color and one strength.",
      ],
      [
        "Set color and strength once",
        "--re-shadow-color and --re-shadow-strength drive all six levels, and a dark ancestor raises the strength and lightens the ring.",
      ],
      [
        "Use a ring, not a border",
        "The ring variants add a hairline in the shadow itself, so the element's size never changes.",
      ],
      [
        "Work without JavaScript",
        "The levels and cards are plain classes in one stylesheet.",
      ],
    ],
    api: [
      ["re-shadow-xs … re-shadow-2xl", "Six shadow levels."],
      [
        "@reuse-sh/shadows/tailwind.css",
        "Optional Tailwind 4 utilities with hover, responsive variants and @apply. Import instead of the plain stylesheet.",
      ],
      [
        "re-shadow-ring-xs … re-shadow-ring-2xl",
        "The same levels with a hairline ring instead of a border.",
      ],
      ["re-card, re-card-frame", "A card surface and its outer frame."],
      [
        "re-card-code, re-card-action",
        "Cards for code samples and for actions.",
      ],
      [
        "--re-shadow-color, --re-shadow-strength",
        "Any CSS color for the shadows, and a multiplier for their strength. Both drive all six levels.",
      ],
      [
        'data-re-theme="dark"',
        "On an ancestor, raises the strength and lightens the ring.",
      ],
    ],
    notes: [
      "For Tailwind 4 variants, import @reuse-sh/shadows/tailwind.css in the consumer stylesheet instead of the unlayered plain stylesheet.",
      "Import the stylesheet. The classes need no JavaScript and no Tailwind.",
      "Use the ring variant instead of adding a border on top of the shadow.",
      'A data-re-theme="dark" ancestor switches to stronger shadows and a light ring.',
    ],
    pages: [
      { path: "", title: "Overview", lead: shadowsDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package and import the stylesheet. Every shadow is a class, so there is no JavaScript to run.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/cards",
            title: "Card patterns",
            lead: "A code card and an action card, both built from the same scale.",
            build: "a code card and an action card",
          },
          {
            path: "examples/scale",
            title: "Scale",
            lead: "The six levels side by side, with and without the hairline ring.",
            build: "a shadow scale with and without the ring",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The stylesheet holds the shadow and card classes, and two custom properties tune all of them.",
      },
    ],
  },
  {
    slug: "easing-gradients",
    name: "Easing gradients",
    description: gradientsDescription,
    packageName: "@reuse-sh/gradients",
    principles: [
      [
        "Ease the stops",
        "The gradient samples an easing curve into a dozen stops instead of one straight ramp, so a fade has no hard edge where it starts or ends.",
      ],
      [
        "Mix in oklab",
        "Interior stops use color-mix() in oklab, so a fade to transparent keeps its hue instead of passing through gray.",
      ],
      [
        "Take any CSS color",
        "The colors are written into the gradient as CSS, so names, oklch() and var() values all work and the browser resolves them.",
      ],
      [
        "Grow the fade with the scroll",
        "In scroll mode each edge of a scroller fades in by the distance left to scroll, so the start stays sharp until you move, and the mask follows right-to-left layouts.",
      ],
      [
        "Refuse broken input",
        "Unknown easings, nonfinite bezier coordinates, X coordinates outside 0 to 1 and stop counts other than integers of at least two throw RangeError.",
      ],
      [
        "Restore what it touched",
        "The fade edge's destroy disconnects its observers and puts the scroller's original style attribute back exactly.",
      ],
    ],
    api: [
      [
        "re-gradient",
        "Static eased linear gradient from styles.css. Set --re-gradient-to; --re-gradient-from defaults to transparent.",
      ],
      [
        "re-gradient-{ease-in-out-sine,ease-in,ease-out,linear}",
        "Choose a named easing curve for a CSS gradient.",
      ],
      [
        "re-gradient-dir-{t,tr,r,br,b,bl,l,tl}",
        "Choose a gradient direction. Bottom is the default.",
      ],
      [
        "@reuse-sh/gradients/tailwind.css",
        "Tailwind 4 utilities, including re-gradient-from-* and re-gradient-to-* theme colors with opacity modifiers.",
      ],
      [
        "easingGradient({ from?, to, easing?, direction?, stops?, type? })",
        "Returns a CSS gradient string to use as a background or a mask.",
      ],
      [
        "from, to",
        'The two colors. from is "transparent" by default. Any CSS color works, var() included.',
      ],
      [
        "easing, EASINGS",
        '"ease-in-out-sine", "ease-in", "ease-out", "linear", or a cubic bezier tuple such as [0.23, 1, 0.32, 1]. "ease-in-out-sine" by default.',
      ],
      [
        "direction, type",
        'The gradient\'s direction, "to bottom" by default for a linear gradient, and "linear" or "radial".',
      ],
      ["stops", "How many stops to sample. 12 by default, at least 2."],
      [
        "easingStops(easing?, stops?)",
        "The sampled positions and progress, each from 0 to 1, for a gradient you write yourself.",
      ],
      [
        "createFadeEdge(scroller, { size?, curve?, mode? })",
        "Masks the edges of a horizontal scroller. Returns update(options) and destroy().",
      ],
      ["size", "The width of each fade in pixels. 64 by default."],
      [
        "curve, FADE_CURVES",
        '"smooth" eases the fade in and out, "linear" is a straight ramp. "smooth" by default.',
      ],
      [
        "mode, FADE_MODES",
        '"scroll" grows each fade with the distance left to scroll. "fixed" keeps it at full size until that edge is reached. "scroll" by default.',
      ],
      [
        "buildFadeGradient(curve, rtl?)",
        "The mask the fade edge writes, for a scroller you measure yourself.",
      ],
    ],
    notes: [
      "Named linear curves are available as static CSS presets with a required end color. The optional Tailwind 4 entry resolves theme colors and variants without adding runtime JavaScript.",
      "easingGradient returns a string. Set it as background-image or mask-image wherever a gradient goes, in CSS-in-JS, a style attribute or a server template.",
      "Curved gradients use color-mix() in oklab for intermediate stops, so they require browser support for color-mix().",
      "createFadeEdge writes a mask and two custom properties to the scroller's inline style and puts the old style back on destroy. It follows right-to-left layouts.",
    ],
    pages: [
      { path: "", title: "Overview", lead: gradientsDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package and add an eased fade with CSS utilities. Use JavaScript for custom curves and scroll-aware masks.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/image-caption",
            title: "Image caption",
            lead: "A caption over a print, made readable by a dark scrim that eases in from nothing.",
            build: "an image caption over an eased scrim",
          },
          {
            path: "examples/fade-edge",
            title: "Fade edge",
            lead: "A strip that scrolls sideways fades out where there is more to see. Drag it and compare the modes.",
            build: "a sideways strip with a fade edge",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/easing-curves",
            title: "Easing curves",
            lead: "Each curve spreads the change differently across the gradient. Pick by where the fade should be quiet.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The module exports easingGradient and easingStops for gradients, and createFadeEdge for scrollers.",
      },
    ],
  },
  {
    slug: "demo-stage",
    name: "Demo stage",
    description: stageDescription,
    packageName: "@reuse-sh/stage",
    principles: [
      [
        "Drive the real component",
        "The cursor sends pointer events to the element under it, so hover, press, drag and release run the component's own code. A control can capture the scripted pointer during its handlers and keep receiving drag events when the cursor leaves it.",
      ],
      [
        "Mark its events",
        "Scripted events bubble like real ones, so handlers delegated to a parent, such as React's, run too. isStageEvent tells them apart, so page code that closes on an outside press can ignore them.",
      ],
      [
        "Leave focus where it is",
        "Scene elements that are not native controls cannot take focus. When a component focuses a native control in the scene, focus goes back where it was, though the page has already seen a focusout.",
      ],
      [
        "Move like a hand",
        "The cursor travels on a shallow arc timed by distance, quick to leave and slow to land, and every press shows.",
      ],
      [
        "Land on a moving target",
        "A move measures its target on every frame, so it lands even when the layout shifts or the stage resizes mid-move.",
      ],
      [
        "Keep cursors independent",
        "Several cursors can use one scene and one clock. Each has its own pointer identity, press and capture. They stop together when the pass ends.",
      ],
      [
        "Start every pass from the first frame",
        "reset runs before every pass. A pass cut short by leaving the screen resets at once, so the scene never resumes halfway.",
      ],
      [
        "Play only when seen",
        "It plays while at least 40% of the stage is on screen and the page is visible, and stops otherwise.",
      ],
      [
        "Hold still for reduced motion",
        "With reduced motion the script never runs, the cursor hides and the scene shows its still frame.",
      ],
      [
        "Stay a picture to the keyboard",
        "The scene is hidden from assistive technology and its controls leave the tab order. The stage carries one label that says what the scene shows.",
      ],
      [
        "Hand over to the visitor",
        "An interactive stage hands the real component to the visitor on hover or touch. A press-to-interact stage hands it over on mouse press or touch tap. It plays again from the first frame 1.2 s after the mouse leaves or 4 s after the last touch, and never while focus is inside the scene.",
      ],
      [
        "Fail loud",
        "A target the scene lacks throws, and the error stops the stage instead of looping on a broken scene.",
      ],
      [
        "Restore the markup",
        "Destroy ends the pass, removes the cursor and listeners, gives the controls back their tab order and unwraps the scene.",
      ],
    ],
    api: [
      [
        "createStage(root, { width, height, label, script, reset?, still?, rest?, additionalCursors?, interactive?, enabled?, delay? })",
        "Turns root into a stage. Its content is the scene, designed at width by height and scaled to the root's width. script receives the primary cursor and an array of additional cursor controls. One pass runs again after it ends.",
      ],
      [
        "act.move(target), act.click(target?), act.press(target?), act.release()",
        "Move the cursor and press with it. A target is a data-stage-target name, an element in the scene, or a point in scene units.",
      ],
      [
        "act.type(field, text), act.scroll(box, { left?, top? })",
        "Type into a text field one character at a time, or scroll a box with the same easing as the cursor.",
      ],
      [
        "act.wait(ms), act.run(change), act.until(check), act.signal",
        "Hold a beat, apply a change and wait until it is painted, wait for a condition, or stop your own work when the pass ends early.",
      ],
      [
        "data-stage-hover, data-stage-active",
        "Set on the control under the cursor and while it is pressed, so a scene can show hover and pressed looks that CSS :hover cannot see.",
      ],
      [
        "isStageEvent(event)",
        "True for an event the cursor sent. Page code that closes something on an outside press can skip these.",
      ],
      [
        "status, cursors, restart(), destroy()",
        "Read whether the stage is waiting, playing, handed to the visitor or still, get its cursor elements, play again from the first frame, or remove the stage.",
      ],
      [
        "Stage",
        "The React component around the same controller. It takes the same options as props and renders its children as the scene.",
      ],
    ],
    notes: [
      "Mark the controls a script aims at with data-stage-target, so the script reads as a list of beats.",
      "End a pass where it began. The cursor returns to rest on its own, and the scene should look like reset() left it.",
      "A scripted click runs the component's real handler. Stop it in the scene before it writes to the clipboard, navigates or opens a modal dialog.",
      "For a slider, press the thumb, move to a point on the track, then release. Pointer capture is supported inside the scene’s pointer handlers.",
      "A page handler that delegates from document.body, such as a site-wide tooltip, sees the scene's events too. Give scene controls attributes the page does not delegate on, or skip isStageEvent there.",
      "A layout your scene resizes from script, such as a gallery, lays out in that frame only when you call its refresh() right after the change.",
    ],
    pages: [
      { path: "", title: "Overview", lead: stageDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, mark the controls the cursor aims at and write one pass of the scene.",
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createStage. The React package adds Stage.",
      },
    ],
  },
  {
    slug: "floating-tooltip",
    name: "Floating tooltip",
    description: tooltipDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Share one popup",
        "Nearby triggers share one tooltip, so moving along a toolbar slides it across instead of closing and reopening it. The closest group that matches a trigger owns it.",
      ],
      [
        "Follow the pointer on a spring",
        "It trails the pointer with a little weight, below and to the right, and never jumps.",
      ],
      [
        "Lean from the edge it hangs on",
        "Its free end trails the pointer. Held to a rail on one axis, it leans as the pointer moves along the other.",
      ],
      [
        "Fade out from the current tilt",
        "When the pointer leaves, the tooltip fades as its tilt settles. Returning during the fade brings it back from its current opacity.",
      ],
      [
        "Anchor to keyboard focus",
        "Keyboard focus places it on the element, and Escape hides it.",
      ],
      [
        "Follow one pointer",
        "The pointer that opened it moves and closes it. A scripted pointer, such as a demo cursor, never moves, closes or takes over a tooltip the visitor's pointer opened. The visitor's pointer takes over by entering another trigger.",
      ],
      [
        "Treat touch as touch",
        "A touch is not hover, so touch input never opens it.",
      ],
      [
        "Hold only a hint",
        "It describes its trigger through aria-describedby and never holds controls or required instructions.",
      ],
      [
        "Release unavailable triggers",
        "A trigger that becomes unavailable cannot open a delayed hint, and an already visible hint closes when its trigger is removed, hidden, or disabled.",
      ],
      [
        "Stay inside the window",
        "It keeps a margin from every edge of the viewport.",
      ],
    ],
    api: [
      [
        "createFloatingTooltip(root, options?)",
        "Binds every trigger inside root to one shared popup. Returns refresh, dismiss, update(options) and destroy.",
      ],
      [
        "positionFloatingTooltip({ reference, size, viewport, side?, offset?, padding? })",
        "Places a measured popup relative to a point and keeps it within the viewport. The point can combine the pointer on one axis with a toolbar edge on the other.",
      ],
      [
        "createFloatingTooltipMotion(window, render)",
        'Drives the same motion when your framework owns the popup and its events. setPosition(point, { snapX?, snapY?, tilt? }) sets the target. Pass tilt: { max, direction?, axis? } for pointer updates, with axis: "y" when x holds to an anchor, resetTilt() for keyboard focus, and stop() when the popup closes.',
      ],
      [
        "data-re-tooltip, data-re-tooltip-template",
        "Marks a trigger. The first holds the hint as text, the second names the id of a template to clone.",
      ],
      [
        "selector",
        "Which elements count as triggers. Both attributes above by default.",
      ],
      [
        "side, sideOffset",
        'Where the popup sits from the pointer, such as "bottom-right" or "top", and how far away. Bottom right and 10 px by default.',
      ],
      [
        "tilt",
        "Leans the popup by up to this many degrees while the pointer moves, along the free axis when track holds the other to the trigger. 5 by default, 0 turns it off.",
      ],
      [
        "delay, closeDelay",
        "The wait before the first hint shows, 150 ms, and before the last one begins to fade, 80 ms. Moving between triggers swaps at once.",
      ],
      [
        "content(trigger)",
        "Returns text or a node for a trigger, in place of the attributes.",
      ],
      ["className", "Added to the popup, for your own styles."],
      [
        "track, viewportPadding",
        "Follow the pointer or stay on the trigger, per axis, and the margin kept from the window edges.",
      ],
      [
        "FloatingTooltip, FloatingTooltipGroup",
        "The React components: one trigger with a content string, or a group that takes the same options. tooltipClassName sets the popup's class.",
      ],
    ],
    notes: [
      "Mark triggers with data-re-tooltip, or with data-re-tooltip-template for rich content.",
      "A tooltip holds a short hint that nobody needs to click. Put controls and required instructions somewhere else.",
      "Keyboard focus shows an anchored hint. A touch is not treated as hover.",
    ],
    pages: [
      { path: "", title: "Overview", lead: tooltipDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then bind the tooltip to the element that holds your triggers.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/shortcuts",
            title: "Toolbar shortcuts",
            lead: "Each button's hint names the action and its shortcut, so the toolbar teaches the keyboard as you use it.",
            build: "toolbar hints that name each shortcut",
          },
          {
            path: "examples/links",
            title: "Link previews",
            lead: "A card with an image and a line of context for links in running text, so a reader can decide before leaving the page.",
            build: "link previews with an image and a line of context",
          },
          {
            path: "examples/people",
            title: "People",
            lead: "A person's card on their name: who they are and what time it is for them, without opening a profile.",
            build: "a person card on their name",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createFloatingTooltip. The React package adds FloatingTooltip for one trigger and FloatingTooltipGroup for many.",
      },
    ],
  },
  {
    slug: "cursor-preview",
    name: "Cursor preview",
    description: previewDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Repeat, never replace",
        "The picture repeats what its item already says and stays hidden from assistive technology. Anything a visitor needs stays on the item.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Arrive where the pointer is",
        "The first frame sits at the pointer and drops in there, instead of flying across the page to reach it.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Follow on a spring, lean with speed",
        "It trails the pointer on a spring stepped by elapsed time, so it moves the same at 60 and 120 frames per second. It leans with horizontal speed up to a cap, then settles upright.",
        "packages/interactions/src/preview-motion.test.ts",
      ],
      [
        "Switch without a gap",
        "The next picture lies under the current one before the current one fades, so the page never shows through the frame. Returning mid-fade brings a picture back from where it is.",
        "tests/browser/cursor-preview.spec.ts",
      ],
      [
        "Never show an empty frame",
        "An image switches in only once it has decoded. Until then, or if it fails, the current picture stays. The first pointer over the group starts loading every image in it.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Hold between items",
        "A gap between items keeps the picture. Only leaving the group closes it, and coming back during the exit brings it back from where it is.",
        "packages/interactions/src/preview-lifecycle.model.test.ts",
      ],
      [
        "Leave faster than it arrives",
        "The exit is a short fade with no spin. Escape hides it at once.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Stay inside the window",
        "It keeps a margin from every edge, rotated corners included, and hangs on the pointer's other side near the right and bottom edges.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Follow one mouse",
        "Touch never opens it, and the pointer that opened it is the only one that moves it. Where the media query does not match, such as a phone, it stays off.",
        "packages/interactions/src/preview.test.ts",
      ],
      [
        "Snap under reduced motion",
        "No spring, lean or drop-in. The picture still shows, at the pointer.",
        "packages/interactions/src/preview.test.ts",
      ],
    ],
    api: [
      [
        "createCursorPreview(root, options?)",
        "Gives every item inside root one shared preview at the pointer. Returns refresh, dismiss, update(options) and destroy.",
      ],
      [
        "data-re-preview, data-re-preview-template",
        "Marks an item. The first holds an image URL, the second names the id of a template to clone.",
      ],
      [
        "selector",
        "Which elements count as items. Both attributes above by default.",
      ],
      [
        "content(item)",
        "Returns a node for an item, in place of the attributes. Images inside it load eagerly and decode before they show. Template clones are made inert; nodes you return stay as you give them, so keep links and buttons out of them. Call refresh() when an item's content changes.",
      ],
      [
        "placement, offset",
        '"corner" hangs the picture offset px below and right of the pointer, 24 by default. "center" centers it on the pointer.',
      ],
      [
        "tilt",
        "The most it leans, in degrees, while the pointer moves. 8 by default, 0 turns it off.",
      ],
      [
        "delay, closeDelay",
        "The wait before the first picture shows, 60 ms, and before it leaves once the pointer is out of the group, 80 ms. Moving between items switches at once.",
      ],
      [
        "media",
        'The media query that turns it on. "(hover: hover) and (pointer: fine)" by default. Add a width to keep it off on small screens.',
      ],
      [
        "className, viewportPadding",
        "Added to the preview, for your own styles, and the margin kept from the window edges, 16 px.",
      ],
      [
        "--re-preview-width, --re-preview-radius, --re-preview-background, --re-preview-shadow",
        "Style the frame. The width applies to data-re-preview images. --re-preview-z-index sets its layer.",
      ],
      [
        "CursorPreview",
        "The React component: a div that takes the same options. previewClassName sets the preview's class.",
      ],
    ],
    notes: [
      "Mark items with data-re-preview for an image, or data-re-preview-template for richer content.",
      "The preview is decoration. Keep names, prices and links on the item itself, and show an inline picture where the media query is off.",
      "Touch and keyboard focus never open it.",
    ],
    pages: [
      { path: "", title: "Overview", lead: previewDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then bind the preview to the list that holds your items.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/collections",
            title: "Collections",
            lead: "Large numbered rows, each leading to a collection. Its photo rides centered on the pointer and swaps as you move down.",
            build: "a collection list with a photo that follows the pointer",
          },
          {
            path: "examples/timeline",
            title: "Timeline",
            lead: "Years across a line. Each entry's photo hangs off the pointer, so the text stays readable.",
            build: "a timeline whose photos hang off the pointer",
          },
          {
            path: "examples/menu",
            title: "Menu cards",
            lead: "A menu whose rows show a card with a picture and a line of context, cloned from a template per row.",
            build: "a menu with a preview card for each row",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createCursorPreview. The React package adds CursorPreview.",
      },
    ],
  },
  {
    slug: "moving-highlight",
    name: "Moving highlight",
    description: highlightDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Measure the real rows",
        "The background takes its size and place from the row itself, also inside scaled containers.",
      ],
      [
        "Let the keyboard lead",
        "Focus moves the background like the pointer does, and keyboard focus wins while it is active.",
      ],
      [
        "Keep selection apart",
        "In selected mode it stays on the selected row, and a second highlight on the same root can follow the pointer.",
      ],
      [
        "Follow layout changes",
        "Resizes and content changes move it to the row's new place.",
      ],
      [
        "Slide near, fade far",
        "Nearby rows slide in 150 ms, distant ones fade out and back in, and reduced motion snaps.",
      ],
      [
        "Skip disabled rows",
        "Disabled and hidden rows never take the highlight.",
      ],
    ],
    api: [
      [
        "createMovingHighlight(root, options?)",
        "Adds one background that moves between the rows inside root. Returns refresh and destroy.",
      ],
      [
        "mode",
        '"hover" follows the pointer and focus and rests on the selected row. "selected" stays on the selected row and moves only when the selection changes. "hover" by default.',
      ],
      [
        "rowSelector, selectedSelector",
        "Which elements are rows, [data-re-row] by default, and which one is selected: data-current, aria-selected or data-highlighted.",
      ],
      [
        "className",
        "Added to the background element. Use it to tell two highlights on one root apart.",
      ],
      [
        "MovingHighlight",
        "The React wrapper around the same controller. highlightClassName sets the background's class.",
      ],
    ],
    notes: [
      "Mark rows with data-re-row and the selected row with data-current.",
      'Two highlights can share a root: one with mode "selected" for the active row, one with mode "hover" for the pointer.',
      "The controller measures the real elements. It does not need a menu library.",
      "Destroy removes the background and restores the styles the controller set.",
    ],
    pages: [
      { path: "", title: "Overview", lead: highlightDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, mark the rows, and bind the highlight to the element that holds them.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/menu",
            title: "Menu",
            lead: "A file menu where the background follows the pointer and the arrow keys from item to item.",
            build:
              "a menu where the highlight follows the pointer and the arrow keys",
          },
          {
            path: "examples/navigation",
            title: "Navigation list",
            lead: "A sidebar with a current page. The background rests there and leaves only while you point elsewhere.",
            build: "a sidebar navigation that rests on the current page",
          },
          {
            path: "examples/tabs",
            title: "Tabs",
            lead: "Two highlights on one row of tabs. The selected fill moves on click, and a lighter one follows the pointer.",
            build: "tabs with a selected fill and a hover fill",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createMovingHighlight. The React package adds MovingHighlight.",
      },
    ],
  },
  {
    slug: "hold-to-confirm",
    name: "Hold to confirm",
    description: holdDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Confirm once per hold",
        "A completed hold calls onConfirm exactly once, and the next action needs a new press.",
      ],
      [
        "Hold the result",
        "A confirmed button keeps its fill and ignores presses until resetMs ends it. Releasing, blur or disabling it does not empty the fill early.",
      ],
      [
        "Cancel on any doubt",
        "Letting go early, leaving the button, blur, Escape or disabling the button cancels the hold. A release from another pointer does not.",
      ],
      [
        "Accept pointer and keys",
        "A pointer, Space or Enter can hold, and keyboard auto-repeat never starts a new hold.",
      ],
      [
        "Let assistive technology click",
        "A click without a physical press, as from a screen reader, confirms at once.",
      ],
      [
        "Own the gesture, not the action",
        "Your code owns the request, the loading state, success and failure.",
      ],
      [
        "Keep the native button",
        "It enhances a button you already have and restores its markup on destroy.",
      ],
    ],
    api: [
      [
        "createHoldToConfirm(button, { onConfirm, onReset?, holdMs?, resetMs? })",
        "Turns a button into a hold. onConfirm runs once the hold completes, and onReset when the confirmed state ends. holdMs is 1200 and resetMs is 1600 by default.",
      ],
      [
        "cancel(), reset(), destroy()",
        "Stops a hold in progress, ends the confirmed state early, or removes the hold and restores the button.",
      ],
      [
        "data-holding, data-confirmed, re-hold-fill",
        "The attributes set on the button while it is held and while it shows a confirmed result, and the fill element that grows across it.",
      ],
      [
        "HoldToConfirmButton",
        "The React button around the same controller. It takes onConfirm, onReset, holdMs and resetMs.",
      ],
    ],
    notes: [
      "The controller owns the gesture. Your code owns the request, the loading state, success and failure.",
      "A click from assistive technology confirms without a physical hold.",
      "Leaving the button, a cancelled pointer, blur, Escape and destroy all cancel a hold in progress.",
    ],
    pages: [
      { path: "", title: "Overview", lead: holdDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package and turn any button into a hold. Your code decides what happens after.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/delete-file",
            title: "Delete file",
            lead: "A file card where delete needs a full press. Let go early and the file stays.",
            build: "a file card whose delete needs a full press",
          },
          {
            path: "examples/settings",
            title: "Settings row",
            lead: "A destructive action at the end of a settings list, held instead of confirmed in a dialog.",
            build: "a held destructive action at the end of a settings list",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createHoldToConfirm. The React package adds HoldToConfirmButton.",
      },
    ],
  },
  {
    slug: "copy-button",
    name: "Copy button",
    description: copyDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Keep one timer",
        "Each result clears the pending reset before it starts a new one, and a slow earlier copy never overwrites a newer result.",
      ],
      [
        "Swap the icon in place",
        "The copy, check and error icons share one grid cell, so the state changes without moving the label or resizing the button.",
      ],
      [
        "Announce the result",
        "A polite live region beside the button says Copied or Copy failed, so screen reader users hear what happened.",
      ],
      [
        "Fall back when refused",
        "When the Clipboard API is missing or refused, it copies through a hidden selection, then restores the selection and focus it found.",
      ],
      [
        "Name an icon-only button",
        "A button with no text and no label gets the accessible name Copy.",
      ],
      [
        "Restore the button",
        "Destroy clears the timer, removes the icon, the status and the class and label it added, and puts back data-state.",
      ],
    ],
    api: [
      [
        "createCopyButton(button, options)",
        "Turns a button you already have into a copy button. Returns destroy.",
      ],
      [
        "text, getText()",
        "The text to copy, or a function that returns it, also as a promise. Pass one of the two.",
      ],
      [
        "resetMs",
        "How long the copied or failed state stays before the button returns to idle. 1600 by default.",
      ],
      [
        "onCopy(text), onError(error)",
        "Called after a copy succeeds or fails, for your own logging or toasts.",
      ],
      [
        "data-state",
        'Set on the button to "idle", "copied" or "error". Style the states from it.',
      ],
      [
        "--re-copy-icon-size, --re-copy-gap, --re-copy-duration",
        "The icon size, 16 px, the gap to the label, 6 px, and the icon swap time, 200 ms.",
      ],
      [
        "CopyButton",
        "The React button around the same controller. It takes text or getText, resetMs, onCopy and onError.",
      ],
    ],
    notes: [
      "The controller adds the icon and a status region and leaves the button's look to your styles.",
      "An empty text or a getText that throws ends in the error state, as a refused copy does.",
      "Give an icon-only button an aria-label that names what it copies, such as Copy link.",
    ],
    pages: [
      { path: "", title: "Overview", lead: copyDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then turn any button into a copy button.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/code-block",
            title: "Code block",
            lead: "A command with a copy button in its corner. The icon turns into a check, and the block stays still.",
            build: "a code block with a copy button",
          },
          {
            path: "examples/share-link",
            title: "Share link",
            lead: "A link to a print, ready to paste. The button copies it and says so.",
            build: "a share panel that copies its link",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createCopyButton. The React package adds CopyButton.",
      },
    ],
  },
  {
    slug: "avatars",
    name: "Avatars",
    description: avatarsDescription,
    packageName: "@reuse-sh/avatars",
    principles: [
      [
        "Show content before enhancement",
        "Photos and initials are available before scripts run, and initials remain when an image fails.",
      ],
      [
        "Cut, never paint",
        "Badges and overlaps are vector clips through the avatar, so no painted ring fights the background and the edge stays sharp at any zoom.",
      ],
      [
        "Keep initials underneath",
        "Initials show until the image loads and stay if it fails.",
      ],
      [
        "Name badges in words",
        "The badge label joins the accessible name, and the drawing stays decorative.",
      ],
      [
        "Treat text as text",
        "Names, labels and icons go in as text or nodes and are never parsed as HTML.",
      ],
      [
        "Size cutouts from the badge",
        "Counts of two digits or more get a capsule cutout measured from the badge itself.",
      ],
      [
        "Restore the host",
        "Destroy puts back the original content, styles and listeners.",
      ],
    ],
    api: [
      [
        "enhanceAvatar(root)",
        "Adds cutouts and fallbacks to avatar markup already on the page. Returns refresh and destroy.",
      ],
      [
        "createAvatar(root, { name, src?, size?, badge? })",
        "Builds an avatar with initials, an image and an optional badge. Size is 40 by default.",
      ],
      [
        "badge",
        '{ type: "dot" | "count" | "icon", label, corner? }. The label joins the accessible name.',
      ],
      [
        "createAvatarGroup(root, options?)",
        "Overlaps avatars and cuts each one, badge included, where the next covers it. Options: overlap, 12 by default, and clearance, 2.",
      ],
      ["getInitials(name)", "Initials for a name, safe for emoji and accents."],
      ["Avatar, AvatarGroup", "The React components around the same code."],
    ],
    notes: [
      "The badge label is part of the accessible name. The badge drawing is decorative.",
      "Counts of two digits or more get a capsule cutout measured from the badge itself.",
      "Initials split on whole characters, so accents and emoji stay intact.",
    ],
    pages: [
      { path: "", title: "Overview", lead: avatarsDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then build avatars or enhance the ones on the page.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/team",
            title: "Team list",
            lead: "Members of a workspace with their status. The badge cuts into the photo, not a ring around it.",
            build: "a team list with status badges",
          },
          {
            path: "examples/stack",
            title: "Stack",
            lead: "A few people in one overlapping stack, ending in a count of the rest.",
            build: "an overlapping avatar stack that ends in a count",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports enhanceAvatar, createAvatar and createAvatarGroup. The React package adds Avatar and AvatarGroup.",
      },
    ],
  },
];

export function findLibrary(slug: string) {
  return libraries.find((library) => library.slug === slug);
}

export function isDocGroup(entry: DocEntry): entry is DocGroup {
  return "pages" in entry;
}

/** Every page of a library in reading order, with the title of its group. */
export function docPages(library: Library): FlatDocPage[] {
  return library.pages.flatMap((entry) =>
    isDocGroup(entry)
      ? entry.pages.map((page) => ({ ...page, group: entry.title }))
      : [entry],
  );
}

export function findDocPage(library: Library, path: string) {
  return docPages(library).find((page) => page.path === path);
}

/** The pages under a path prefix such as "examples/", as route parameters. */
export function docParams(prefix: string) {
  return libraries.flatMap((library) =>
    docPages(library)
      .filter((page) => page.path.startsWith(prefix))
      .map((page) => ({
        library: library.slug,
        page: page.path.slice(prefix.length),
      })),
  );
}

export function docHref(library: Library, path: string) {
  return path ? `/${library.slug}/${path}` : `/${library.slug}`;
}

export function installCommand(library: Library) {
  return `npm install ${library.packageName}`;
}

const siteUrl = "https://reuse.sh";
const keepPrinciples = "Keep the principles the guide lists.";

/** The short prompt that hands a library to a coding agent. */
export function libraryPrompt(library: Library) {
  return `Read ${guideUrl(library.slug)} and add ${library.name} to <where>. ${keepPrinciples}`;
}

/** The prompt for a documentation page, or null when the page has none. */
export function pagePrompt(
  library: Library,
  path: string,
  platform: UsagePlatform,
) {
  if (path === "getting-started")
    return `Read ${guideUrl(library.slug)}, install ${library.packageName} and add ${library.name} to <where>. ${keepPrinciples}`;
  const page = findDocPage(library, path);
  if (!page || !path) return null;
  const reference = `${siteUrl}${docHref(library, path)}${platform === "html" ? "?framework=html" : ""}`;
  if (!page.build)
    return `Read ${guideUrl(library.slug)} and use ${reference} as the reference for adding ${library.name} to <where>. ${keepPrinciples}`;
  return `Read ${guideUrl(library.slug)} and build ${page.build} like ${reference}. ${keepPrinciples}`;
}

export const toolGroups = [
  "Icons",
  "Images",
  "Components",
  "Motion and numbers",
  "Code",
] as const;

export type ToolGroup = (typeof toolGroups)[number];

/** An interface tool we use beside Reuse, with one line on why. */
export interface Tool {
  name: string;
  url: string;
  reason: string;
  group: ToolGroup;
}

export const tools: readonly Tool[] = [
  {
    name: "Hugeicons",
    url: "https://hugeicons.com",
    reason:
      "Thousands of free stroke-rounded icons on one 24 px grid, imported one at a time, with packages for React, Vue, Angular and Svelte.",
    group: "Icons",
  },
  {
    name: "Lucide",
    url: "https://lucide.dev",
    reason:
      "An open-source icon set with a consistent stroke, drawn by a community and shipped for most frameworks.",
    group: "Icons",
  },
  {
    name: "Boring Avatars",
    url: "https://boringavatars.com",
    reason:
      "Generated SVG avatars from a name and a palette. The marble textures across this site follow its marble variant.",
    group: "Images",
  },
  {
    name: "shadcn/ui",
    url: "https://ui.shadcn.com",
    reason:
      "Accessible components you copy into your project as source, so you own and change every line.",
    group: "Components",
  },
  {
    name: "Base UI",
    url: "https://base-ui.com",
    reason:
      "Unstyled, accessible React components that handle focus, keyboard and state and leave the look to you.",
    group: "Components",
  },
  {
    name: "cmdk",
    url: "https://cmdk.paco.me",
    reason:
      "A fast, unstyled command menu for React with filtering and keyboard navigation built in.",
    group: "Components",
  },
  {
    name: "Sonner",
    url: "https://sonner.emilkowal.ski",
    reason:
      "Toast notifications for React that stack, swipe away and need almost no setup.",
    group: "Components",
  },
  {
    name: "Motion",
    url: "https://motion.dev",
    reason:
      "Springs, gestures and layout animation for JavaScript and React, with a small API.",
    group: "Motion and numbers",
  },
  {
    name: "NumberFlow",
    url: "https://number-flow.barvian.me",
    reason:
      "Animates a number from one value to the next, digit by digit, with formatting from Intl.NumberFormat.",
    group: "Motion and numbers",
  },
  {
    name: "Highlights by Pierre",
    url: "https://diffs.com/docs#highlights",
    reason:
      "A syntax highlighter written in WebAssembly Text, with 80 built-in languages, that runs in Node.js, browsers and Cloudflare Workers.",
    group: "Code",
  },
];

export { getUsage, usageRecipes } from "./usage.js";
export { usageMarkdown } from "./usage-markdown.js";
export type {
  UsageBlock,
  UsageLanguage,
  UsagePlatform,
  UsageRecipe,
  UsageSection,
} from "./usage-types.js";
