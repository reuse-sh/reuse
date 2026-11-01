/** A name and its explanation: an API entry or a feature. */
export type Row = readonly [name: string, text: string];

/** One documentation page. The path is relative to the library, "" for its overview. */
export interface DocPage {
  path: string;
  title: string;
  lead: string;
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
  features: readonly Row[];
  api: readonly Row[];
  notes: readonly string[];
  agentPrompt: string;
  pages: readonly DocEntry[];
}

export interface FlatDocPage extends DocPage {
  group?: string;
}

function guideUrl(slug: string) {
  return `https://reuse.sh/${slug}/guide.md`;
}

function agentPage(name: string): DocPage {
  return {
    path: "agent",
    title: "Agent guide",
    lead: `Each library ships a guide written for coding agents. Give yours the link and say where ${name} should go.`,
  };
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
  "Six shadow levels, a hairline ring, and a fade for scrolling edges.";
const highlightDescription =
  "One background that slides to the row under the pointer, the focus or the selection.";
const holdDescription =
  "A button that acts only after a full press. Let go early and nothing happens.";
const avatarsDescription =
  "Photos and initials with badges and groups, cut out cleanly on any background.";

export const libraries: Library[] = [
  {
    slug: "lightbox",
    name: "Lightbox",
    description: lightboxDescription,
    packageName: "@reuse-sh/lightbox",
    features: [
      [
        "Opens from the thumbnail",
        "The image grows out of its cropped preview and goes back to the same place on close.",
      ],
      [
        "Native paging",
        "Pages are a scroll-snap strip, so touch and trackpads keep the system's momentum.",
      ],
      [
        "Pinch, wheel, double-tap",
        "Zoom follows the pointer or fingers and pans within the image's edges.",
      ],
      [
        "Focus and scroll kept",
        "Focus returns to the trigger and the page behind never jumps.",
      ],
      [
        "Loads what it shows",
        "Only the current and neighboring images load. Long jumps skip the pages in between.",
      ],
      [
        "Your markup",
        "Captions, thumbnails and controls take your CSS, not ours.",
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
      "Images and captions are supported, with optional thumbnails. Video and iframes are not supported yet.",
    ],
    agentPrompt: `Read ${guideUrl("lightbox")} and add the lightbox to the product gallery. Keep our button styles.`,
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
          },
          {
            path: "examples/chat",
            title: "Chat thread",
            lead: "Prints shared in a conversation. Each message pages through its own images.",
          },
          {
            path: "examples/journal",
            title: "Journal",
            lead: "A short essay about a print series. Every image opens in one sequence, shown whole whatever its crop.",
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
            lead: "Images work today. Video, YouTube, Vimeo and iframes are planned.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createLightbox and bindLightboxGallery. The React hook returns the same viewer.",
      },
      agentPage("Lightbox"),
    ],
  },
  {
    slug: "carousel",
    name: "Carousel",
    description: carouselDescription,
    packageName: "@reuse-sh/carousel",
    features: [
      [
        "Native scroll",
        "Touch and trackpads use CSS scroll snap and keep their momentum.",
      ],
      [
        "Mouse drag",
        "Drag with a mouse. A drag never opens the link under it.",
      ],
      [
        "Endless loop",
        "Slides repeat without cloning, so buttons and links inside stay unique.",
      ],
      [
        "Autoplay that waits",
        "Pauses for hover, focus, drag, hidden tabs and reduced motion.",
      ],
    ],
    api: [
      [
        "createCarousel(viewport, options?)",
        "Binds a scroll-snap strip. Options: slides, align, loop, drag, group, autoplay, releaseMotion, releaseDuration, onChange.",
      ],
      [
        "releaseMotion",
        '"spring" glides to the nearest slide after a drag or a flick. "native" leaves the settle to the browser\'s scroll snap. "spring" by default.',
      ],
      [
        "releaseDuration",
        "How long the spring glide takes, in milliseconds. 260 by default.",
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
    agentPrompt: `Read ${guideUrl("carousel")} and turn the related products row into a carousel. Keep our arrows.`,
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
          },
          {
            path: "examples/editorial",
            title: "Editorial gallery",
            lead: "A series of prints at a readable size, starting at the text column and running off the page.",
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
      agentPage("Carousel"),
    ],
  },
  {
    slug: "annotations",
    name: "Annotations",
    description: annotationsDescription,
    packageName: "@reuse-sh/annotations",
    features: [
      [
        "Six kinds",
        "Area, spotlight, arrow, line, pointer and numbered marker.",
      ],
      [
        "Marks that stay put",
        "Coordinates are percentages, so every mark keeps its place at any image size.",
      ],
      [
        "One format",
        "A versioned JSON document you can store, render on the server and edit.",
      ],
      [
        "An editor",
        "Draw, move and resize marks with a pointer or the keyboard, with undo and redo.",
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
    agentPrompt: `Read ${guideUrl("annotations")} and show annotations on the screenshots in our help articles.`,
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
          },
          {
            path: "examples/editor",
            title: "Editor",
            lead: "Draw a mark, move it, change your mind. The page holds the annotations and the editor reports each change.",
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
      agentPage("Annotations"),
    ],
  },
  {
    slug: "loaders",
    name: "Loaders",
    description: loadersDescription,
    packageName: "@reuse-sh/loaders",
    features: [
      [
        "Sixteen figures",
        "Triangles, squares, circles, a spiral and rows, each drawn with three or four dots.",
      ],
      [
        "Dots that travel",
        "Between figures the dots move to their new places instead of popping.",
      ],
      [
        "One engine",
        "The same timeline runs a single figure or the whole sequence.",
      ],
      [
        "Still when unseen",
        "It stops offscreen and in hidden tabs, and shows a still frame under reduced motion.",
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
    agentPrompt: `Read ${guideUrl("loaders")} and show ThinkingDots while the assistant prepares an answer.`,
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
          },
          {
            path: "examples/figures",
            title: "Figures",
            lead: "All sixteen figures, each on repeat. Pass a name to figureConfig to use one.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createThinkingDots and its timeline. The React package adds ThinkingDots.",
      },
      agentPage("Loaders"),
    ],
  },
  {
    slug: "shadows",
    name: "Shadows",
    description: shadowsDescription,
    packageName: "@reuse-sh/shadows",
    features: [
      ["Six levels", "From a small control to a floating panel."],
      [
        "Two soft layers",
        "Each level is a close shadow and a wide one, with an optional hairline ring.",
      ],
      [
        "Custom properties",
        "Set the color and strength once with --reuse-shadow-color and --reuse-shadow-strength.",
      ],
      [
        "Fade edge",
        "Scrolling strips fade out at the side that has more to show.",
      ],
    ],
    api: [
      ["reuse-shadow-xs … reuse-shadow-2xl", "Six shadow levels."],
      [
        "reuse-shadow-ring-xs … reuse-shadow-ring-2xl",
        "The same levels with a hairline ring instead of a border.",
      ],
      ["reuse-card, reuse-card-frame", "A card surface and its outer frame."],
      [
        "reuse-card-code, reuse-card-action",
        "Cards for code samples and for actions.",
      ],
      ["shadowLevels", 'The level names in order, from "xs" to "2xl".'],
      [
        "createFadeEdge(scroller, { size, curve, mode })",
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
    ],
    notes: [
      "Import the stylesheet. The classes need no JavaScript and no Tailwind.",
      "Use the ring variant instead of adding a border on top of the shadow.",
      'A data-reuse-theme="dark" ancestor switches to stronger shadows and a light ring.',
      "createFadeEdge writes a mask to the scroller's inline style and puts the old style back on destroy. It follows right-to-left layouts.",
    ],
    agentPrompt: `Read ${guideUrl("shadows")} and move our cards to the shadow scale. Keep our radii.`,
    pages: [
      { path: "", title: "Overview", lead: shadowsDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package and import the stylesheet. The shadows are classes, and the fade edge is one function.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/cards",
            title: "Card patterns",
            lead: "A code card and an action card, both built from the same scale.",
          },
          {
            path: "examples/scale",
            title: "Scale",
            lead: "The six levels side by side, with and without the hairline ring.",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/fade-edge",
            title: "Fade edge",
            lead: "A strip that scrolls sideways fades out where there is more to see. Scroll it and compare the modes.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The stylesheet holds the shadow and card classes. The module exports createFadeEdge and the level names.",
      },
      agentPage("Shadows"),
    ],
  },
  {
    slug: "floating-tooltip",
    name: "Floating tooltip",
    description: tooltipDescription,
    packageName: "@reuse-sh/interactions",
    features: [
      [
        "One popup",
        "Nearby triggers share it, so moving along a toolbar slides the hint across instead of closing and opening it.",
      ],
      [
        "Follows on a spring",
        "It trails the pointer with a little weight, below and to the right of it, and never jumps.",
      ],
      [
        "Leans as it moves",
        "It tilts a few degrees toward the direction of travel and settles when the pointer stops.",
      ],
      [
        "Rich content",
        "Text by default. A template or a function can put a shortcut, an image or a person's card inside.",
      ],
      [
        "Keyboard focus",
        "Focus anchors it to the element, and Escape hides it.",
      ],
      [
        "Stays on screen",
        "It keeps a 12 px margin from every edge of the window.",
      ],
    ],
    api: [
      [
        "createFloatingTooltip(root, options?)",
        "Binds every trigger inside root to one shared popup. Returns refresh, dismiss, update(options) and destroy.",
      ],
      [
        "data-reuse-tooltip, data-reuse-tooltip-template",
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
      "Mark triggers with data-reuse-tooltip, or with data-reuse-tooltip-template for rich content.",
      "A tooltip holds a short hint that nobody needs to click. Put controls and required instructions somewhere else.",
      "Keyboard focus shows an anchored hint. A touch is not treated as hover.",
    ],
    agentPrompt: `Read ${guideUrl("floating-tooltip")} and give the editor toolbar buttons one shared tooltip. Use their aria-label text.`,
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
          },
          {
            path: "examples/links",
            title: "Link previews",
            lead: "A card with an image and a line of context for links in running text, so a reader can decide before leaving the page.",
          },
          {
            path: "examples/people",
            title: "People",
            lead: "A person's card on their name: who they are and what time it is for them, without opening a profile.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createFloatingTooltip. The React package adds FloatingTooltip for one trigger and FloatingTooltipGroup for many.",
      },
      agentPage("Floating tooltip"),
    ],
  },
  {
    slug: "moving-highlight",
    name: "Moving highlight",
    description: highlightDescription,
    packageName: "@reuse-sh/interactions",
    features: [
      [
        "Pointer and keyboard",
        "Hover and focus move the same background, measured from the real row.",
      ],
      [
        "Selection kept apart",
        "A second highlight can hold the selected row while the first follows the pointer.",
      ],
      [
        "Keeps up with layout",
        "Resizes and content changes move it to the row's new place.",
      ],
      [
        "Short and long moves",
        "Nearby rows slide in 150 ms. Distant ones fade out and back in.",
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
        "Which elements are rows, [data-reuse-row] by default, and which one is selected: data-current, aria-selected or data-highlighted.",
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
      "Mark rows with data-reuse-row and the selected row with data-current.",
      'Two highlights can share a root: one with mode "selected" for the active row, one with mode "hover" for the pointer.',
      "The controller measures the real elements. It does not need a menu library.",
      "Destroy removes the background and restores the styles the controller set.",
    ],
    agentPrompt: `Read ${guideUrl("moving-highlight")} and add a moving highlight to the sidebar navigation.`,
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
          },
          {
            path: "examples/navigation",
            title: "Navigation list",
            lead: "A sidebar with a current page. The background rests there and leaves only while you point elsewhere.",
          },
          {
            path: "examples/tabs",
            title: "Tabs",
            lead: "Two highlights on one row of tabs. The selected fill moves on click, and a lighter one follows the pointer.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createMovingHighlight. The React package adds MovingHighlight.",
      },
      agentPage("Moving highlight"),
    ],
  },
  {
    slug: "hold-to-confirm",
    name: "Hold to confirm",
    description: holdDescription,
    packageName: "@reuse-sh/interactions",
    features: [
      ["Any input", "Hold with a pointer, Space or Enter."],
      [
        "Easy to cancel",
        "Release early, move off the button or press Escape, and nothing happens.",
      ],
      ["Once per hold", "Each completed hold confirms exactly once."],
      [
        "Assistive activation",
        "A click from assistive technology confirms without a physical hold.",
      ],
    ],
    api: [
      [
        "createHoldToConfirm(button, { onConfirm, holdMs? })",
        "Turns a button into a hold. onConfirm runs once the hold completes. holdMs is 1200 by default.",
      ],
      [
        "cancel(), destroy()",
        "Stops a hold in progress, or removes the hold and restores the button.",
      ],
      [
        "data-holding, reuse-hold-fill",
        "The attribute set on the button while it is held, and the fill element that grows across it.",
      ],
      [
        "HoldToConfirmButton",
        "The React button around the same controller. It takes onConfirm and holdMs.",
      ],
    ],
    notes: [
      "The controller owns the gesture. Your code owns the request, the loading state, success and failure.",
      "A click from assistive technology confirms without a physical hold.",
      "Leaving the button, a cancelled pointer, blur, Escape and destroy all cancel a hold in progress.",
    ],
    agentPrompt: `Read ${guideUrl("hold-to-confirm")} and make the Delete project button a hold to confirm.`,
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
          },
          {
            path: "examples/settings",
            title: "Settings row",
            lead: "A destructive action at the end of a settings list, held instead of confirmed in a dialog.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports createHoldToConfirm. The React package adds HoldToConfirmButton.",
      },
      agentPage("Hold to confirm"),
    ],
  },
  {
    slug: "avatars",
    name: "Avatars",
    description: avatarsDescription,
    packageName: "@reuse-sh/avatars",
    features: [
      [
        "Real cutouts",
        "Badges and overlaps cut through the image, so no painted ring fights your background.",
      ],
      ["Badges", "A dot, a count or an icon, each with its own cutout."],
      ["Groups", "Each avatar in a stack is cut where the next one covers it."],
      [
        "Fallbacks",
        "Initials show until the image loads, and stay if it fails.",
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
        "Overlaps avatars and cuts each one where the next covers it. Options: overlap, 12 by default, and clearance, 2.",
      ],
      ["getInitials(name)", "Initials for a name, safe for emoji and accents."],
      ["Avatar, AvatarGroup", "The React components around the same code."],
    ],
    notes: [
      "The badge label is part of the accessible name. The badge drawing is decorative.",
      "Counts of two digits or more get a capsule cutout measured from the badge itself.",
      "Initials split on whole characters, so accents and emoji stay intact.",
    ],
    agentPrompt: `Read ${guideUrl("avatars")} and use it for the avatars in the member list, with an online dot.`,
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
          },
          {
            path: "examples/groups",
            title: "Groups",
            lead: "Overlapping stacks for who is in a project, ending in a count of the rest.",
          },
        ],
      },
      {
        path: "api",
        title: "API",
        lead: "The browser module exports enhanceAvatar, createAvatar and createAvatarGroup. The React package adds Avatar and AvatarGroup.",
      },
      agentPage("Avatars"),
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
