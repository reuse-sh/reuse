import type { UsagePlatform } from "./usage-types.js";
/** A name and its explanation: an API entry or a principle. */
export type Row = readonly [name: string, text: string];

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
  principles: readonly Row[];
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
        "Pages are a scroll-snap strip from the carousel, so touch and trackpads keep the system's momentum.",
      ],
      [
        "Open from the thumbnail and return to it",
        "The image grows out of its cropped preview and goes back to the same place on close.",
      ],
      [
        "Load only what is near",
        "Only the current and neighboring images load, and a long jump skips the pages in between.",
      ],
      [
        "Zoom around the point you touch",
        "Pinch, wheel and double-tap zoom around the pointer or fingers, and panning stops at the image's edges.",
      ],
      [
        "Keep focus inside and give it back",
        "The viewer is a native modal dialog, and closing it returns focus to the element that opened it.",
      ],
      [
        "Leave the page as it was",
        "Destroy restores the page scroll, the hidden thumbnail, and every style and listener the viewer touched.",
      ],
    ],
    api: [
      [
        "createLightbox(options?)",
        "Creates a viewer. Options include thumbnails, imageClick, doubleTapZoom, maxZoom, padding, className and icons.",
      ],
      [
        "bindLightboxGallery(root, options?)",
        "Opens every image inside root in the viewer, in page order. Its destroy also removes the click listener.",
      ],
      [
        "open(items, index?)",
        "Opens at an index. Items carry src, alt, caption, the natural size and an optional origin.",
      ],
      [
        "close(), next(), prev(), goTo(index)",
        "Moves through the set from code. Close returns to the origin thumbnail.",
      ],
      [
        "zoomTo(scale, focus?), toggleZoom(focus?)",
        "Zooms to a scale around a point, or between fit and the tap zoom.",
      ],
      [
        "getState(), subscribe(listener)",
        "Reads and listens to the index, zoom and open state.",
      ],
      ["destroy()", "Removes listeners and restores the page."],
    ],
    notes: [
      'A click on the image zooms by default. For a publishing gallery, set imageClick: "close" and doubleTapZoom: false.',
      "Paging runs on the carousel package. Only the current and neighboring images stay loaded. Next and previous scroll smoothly, and a jump from a distant thumbnail fades through the backdrop so unloaded pages never flash past.",
      "Images and captions are supported, with optional thumbnails. Video and iframe players are outside this image viewer.",
    ],
    pages: [
      { path: "", title: "Overview", lead: lightboxDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then bind the viewer to the element that holds your images.",
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
            lead: "Thumbnails along the bottom edge. The active one stays centered as you page.",
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
        lead: "The browser module exports createLightbox and bindLightboxGallery. The React hook returns the same viewer.",
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
        "A mouse drag, or the mouse press that stops a moving strip, never opens the link under it. An ordinary click still works, and touch stays native.",
      ],
      [
        "Drag like a trackpad",
        "A released mouse drag keeps its speed and glides to the slide nearest where it would stop, never past a slide that asks to stop. Past either end it stretches and springs back.",
      ],
      [
        "Keep the slide it was sent to",
        "When the last slides share one scroll position, the active index stays the slide that goTo, a dot or a lightbox chose.",
      ],
      [
        "Repeat without clones",
        "The loop moves the original slides, so ids, links and buttons stay unique, and it turns on only when the slides can cover the viewport.",
      ],
      [
        "Let autoplay wait for people",
        "Autoplay pauses for hover, focus, dragging, hidden pages, offscreen strips and reduced motion.",
      ],
      [
        "Keep keys local",
        "Arrow keys act only inside the focused strip and swap sides in right-to-left layouts.",
      ],
      [
        "Put back what it moved",
        "Destroy cancels timers and restores the styles, transforms and listeners it added.",
      ],
    ],
    api: [
      [
        "createCarousel(viewport, options?)",
        "Binds a scroll-snap strip. Options: slides, align, loop, drag, group, autoplay, releaseMotion, releaseDuration, onChange.",
      ],
      [
        "releaseMotion",
        'How a released mouse drag travels to its slide. "spring" starts at the drag speed and decays like trackpad momentum; "native" uses the browser\'s smooth scroll. Both pick the same slide: the one nearest where the drag would stop. "spring" by default; reduced motion jumps.',
      ],
      [
        "releaseDuration",
        "How long the spring takes to settle a slow release or a stretched end, in milliseconds. 260 by default. A flick glides on with its own momentum.",
      ],
      [
        "next(), prev(), goTo(index, behavior?)",
        "Moves by one group or to a slide. goTo takes an optional scroll behavior.",
      ],
      [
        "getState(), subscribe(listener)",
        "Index, count, progress, canPrev, canNext, and whether it is playing, dragging or looping.",
      ],
      [
        "play(), pause()",
        "Starts and stops autoplay. It also waits for hover, focus, drag and hidden tabs on its own.",
      ],
      [
        "setEnabled(enabled)",
        "Turns scrolling and dragging off and back on, keeping the current position.",
      ],
      ["refresh()", "Measures again after slides are added or removed."],
      ["destroy()", "Removes listeners and restores the viewport."],
      [
        "syncCarousels(...carousels)",
        "Keeps several carousels on the same index. Returns a function that stops it.",
      ],
    ],
    notes: [
      "The loop needs enough slides to cover the viewport plus the widest slide. With fewer, isLooping is false and the strip scrolls normally.",
      "That check runs again after a resize or a content change.",
      "Autoplay pauses for hover, focus, dragging, hidden pages, offscreen strips and reduced motion.",
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
        lead: "The browser module exports createCarousel. The React package adds useCarousel and a Carousel component.",
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
        "createAnnotationEditor(root, options)",
        "A controlled editor. It reports every change through onChange and leaves storage to you.",
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
        "Each stop is a color-mix() in oklab, so a fade to transparent keeps its hue instead of passing through gray.",
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
        "An unknown easing, a bezier outside 0 to 1 or fewer than two stops throws a RangeError instead of writing a gradient the browser drops.",
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
    slug: "floating-tooltip",
    name: "Floating tooltip",
    description: tooltipDescription,
    packageName: "@reuse-sh/interactions",
    principles: [
      [
        "Share one popup",
        "Nearby triggers share one tooltip, so moving along a toolbar slides it across instead of closing and reopening it.",
      ],
      [
        "Follow the pointer on a spring",
        "It trails the pointer with a little weight, below and to the right, and never jumps.",
      ],
      [
        "Anchor to keyboard focus",
        "Keyboard focus places it on the element, and Escape hides it.",
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
        "Leans the popup by up to this many degrees while the pointer moves. 5 by default, 0 turns it off.",
      ],
      [
        "delay, closeDelay",
        "The wait before the first hint shows, 150 ms, and before the last one hides, 80 ms. Moving between triggers swaps at once.",
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
        "Letting go early, leaving the button, blur, Escape or disabling the button cancels the hold.",
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
