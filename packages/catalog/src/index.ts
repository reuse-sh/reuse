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

const startLead =
  "Install the package, import the stylesheet once, then connect it to your markup.";

function basicPages(name: string, description: string, api: string) {
  return [
    { path: "", title: "Overview", lead: description },
    { path: "getting-started", title: "Getting started", lead: startLead },
    { path: "api", title: "API", lead: api },
    agentPage(name),
  ];
}

const lightboxDescription =
  "A native image viewer, from thumbnail to every little detail.";
const carouselDescription =
  "Native scrolling. Precise controls. A strip that belongs to your page.";
const tooltipDescription =
  "One shared hint, following the pointer with a steady hand.";
const annotationsDescription =
  "Point to what matters, with a format your tools can share.";
const loadersDescription =
  "Small signs of progress, with movement worth keeping.";
const shadowsDescription =
  "A little depth, with a clear edge and a soft falloff.";
const highlightDescription = "A single surface that follows the item in focus.";
const holdDescription = "An intentional press, with time to change your mind.";
const avatarsDescription =
  "Images, initials, and the small details around them.";

export const libraries: Library[] = [
  {
    slug: "lightbox",
    name: "Lightbox",
    description: lightboxDescription,
    packageName: "@reuse-sh/lightbox",
    features: [
      [
        "Open from the thumbnail",
        "The photo grows out of its cropped preview and returns to the same place on close.",
      ],
      [
        "Native paging",
        "Pages are a scroll-snap strip, so touch and trackpads keep the system's momentum.",
      ],
      [
        "Pinch, wheel, double-tap",
        "Zoom follows the pointer or fingers and pans within the photo's edges.",
      ],
      [
        "Focus and scroll kept",
        "Focus returns to the trigger and the page behind never jumps.",
      ],
      [
        "Only what is needed",
        "The current and neighboring images load. Distant jumps skip the pages in between.",
      ],
      [
        "Your markup",
        "Captions, thumbnails and controls are styled with your CSS, not ours.",
      ],
    ],
    api: [
      [
        "createLightbox(options?)",
        "Creates a viewer. Options: thumbnails, imageClick, maxZoom, padding, className and icons.",
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
        "Programmatic navigation. Close returns to the origin thumbnail.",
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
      'Image click zooms by default. Use imageClick: "close" and doubleTapZoom: false for a publishing gallery.',
      "Pages are driven by the shared native carousel. Only the current and neighboring images stay loaded, and pages still on screen while the strip travels are kept. Adjacent navigation scrolls smoothly; distant thumbnail jumps fade through the backdrop so unloaded pages never appear in between.",
      "Captions and optional thumbnails are supported. Video, iframe, and product-specific annotation cloning are not media renderers in this release.",
    ],
    agentPrompt: `Read ${guideUrl("lightbox")} and add the lightbox to the product gallery. Keep our button styles.`,
    pages: [
      { path: "", title: "Overview", lead: lightboxDescription },
      {
        path: "getting-started",
        title: "Getting started",
        lead: "Install the package, import the stylesheet once, then bind the viewer to the element that holds your photos.",
      },
      {
        title: "Examples",
        pages: [
          {
            path: "examples/product",
            title: "Product page",
            lead: "A main photo and its thumbnails open as one set, each at its own place.",
          },
          {
            path: "examples/chat",
            title: "Chat thread",
            lead: "Photos inside a conversation. Each message pages through its own photos.",
          },
          {
            path: "examples/journal",
            title: "Photo journal",
            lead: "Long-form photos in one sequence, shown whole in the viewer whatever their crop.",
          },
        ],
      },
      {
        title: "Control styles",
        pages: [
          {
            path: "controls/minimal",
            title: "Minimal",
            lead: "Only a close button. Swipe, drag, or press the arrow keys to move, and Escape to leave.",
          },
          {
            path: "controls/classic",
            title: "Classic",
            lead: "Side arrows, a counter in the corner, and the caption under the photo.",
          },
          {
            path: "controls/filmstrip",
            title: "Filmstrip",
            lead: "Thumbnails along the bottom edge. The active crop stays centered as you page.",
          },
          {
            path: "controls/panel",
            title: "Panel",
            lead: "Caption and details in a side panel, which moves under the photo on narrow screens.",
          },
          {
            path: "controls/immersive",
            title: "Immersive",
            lead: "A dark room for the photo. The controls fade after two seconds and return on any movement.",
          },
          {
            path: "controls/toolbar",
            title: "Toolbar",
            lead: "Paging, the counter, and zoom gathered in one floating toolbar, as in a photos app.",
          },
        ],
      },
      {
        title: "Guides",
        pages: [
          {
            path: "guides/media",
            title: "Media",
            lead: "Images are supported today. Video, YouTube, Vimeo and iframes are planned.",
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
      ["Native scroll", "Touch and trackpad use CSS scroll snap."],
      ["Mouse drag", "Drag with a mouse without opening links by accident."],
      ["Repeat", "Endless loop without cloning interactive slides."],
      [
        "Autoplay that waits",
        "Pauses for hover, focus, drag, hidden tabs and reduced motion.",
      ],
    ],
    api: [
      [
        "createCarousel(viewport, options?)",
        "Binds a scroll-snap strip. Options: slides, align, loop, drag, group, autoplay, onChange.",
      ],
      [
        "next(), prev(), goTo(index)",
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
      ["refresh()", "Measures again after slides are added or removed."],
      ["destroy()", "Removes listeners and restores the viewport."],
      [
        "syncCarousels(...carousels)",
        "Keeps several carousels on the same index. Returns a function that stops it.",
      ],
    ],
    notes: [
      "Repeat needs enough content to cover the viewport and the largest slide. When there is not enough, isLooping is false and ordinary scrolling remains available.",
      "The coverage condition is cycleWidth >= viewportWidth + largestSlideWidth. It is reevaluated after resize or content changes.",
      "Autoplay pauses for hover, focus, dragging, hidden pages, offscreen content, and reduced motion.",
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
            lead: "Related products a page at a time. The arrows know when there is nothing left to show.",
          },
          {
            path: "examples/editorial",
            title: "Editorial gallery",
            lead: "A story's photos at a readable size, starting at the text column and running off the page.",
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
      ["Six kinds", "Area, spotlight, arrow, line, pointer, and marker."],
      [
        "Coordinates that follow",
        "Percentages keep every mark on its place at any image size.",
      ],
      [
        "One format",
        "A validated document for storage, rendering, and editing.",
      ],
      ["An editor", "A controlled editor with keyboard, undo, and redo."],
    ],
    api: [
      [
        "parseAnnotations(value)",
        "Reads a version 1 document or the six-kind array. Invalid annotations are dropped, an unsupported version throws.",
      ],
      [
        "serializeAnnotations(value), annotationsToHtml(value)",
        "Writes the version 1 JSON document, or the annotations as a list in HTML.",
      ],
      [
        "annotationsFromHtml(element)",
        "Reads annotations back from that HTML list.",
      ],
      [
        "renderAnnotations(value, options)",
        "Returns the overlay markup for an image ratio and a unique id, for server rendering.",
      ],
      [
        "createAnnotatedImage(root, options)",
        "Renders an image with its annotations and keeps them placed on resize.",
      ],
      [
        "createAnnotationEditor(root, options)",
        "A controlled editor. It reports every change and leaves storage to you.",
      ],
    ],
    notes: [
      "The versioned JSON document is { version: 1, annotations: [...] }. The existing six-kind array is also accepted.",
      "Marker text permits strong, em, and code only. Labels and attributes are escaped at the boundary.",
      "Pointer labels move to a numbered list when the available width is narrow.",
    ],
    agentPrompt: `Read ${guideUrl("annotations")} and show annotations on the screenshots in our help articles.`,
    pages: basicPages(
      "Annotations",
      annotationsDescription,
      "The browser module parses, renders and edits one annotation format. The React package wraps the image and the editor.",
    ),
  },
  {
    slug: "loaders",
    name: "Loaders",
    description: loadersDescription,
    packageName: "@reuse-sh/loaders",
    features: [
      ["Sixteen figures", "Geometric dot figures from one native timeline."],
      [
        "Dots that travel",
        "Dots move between figures rather than disappearing.",
      ],
      ["One engine", "The same engine runs a single preset or a sequence."],
      [
        "Quiet when unseen",
        "Animation stops when hidden and respects reduced motion.",
      ],
    ],
    api: [
      [
        "createThinkingDots(canvas, options?)",
        "Draws the dots on a canvas. Options: size and config.",
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
        "createTimeline(config, seed), sampleDot(timeline, dot, time)",
        "The timeline and sampler the canvas uses, for your own renderer.",
      ],
    ],
    notes: [
      "The default sequence morphs through the full collection. A figure preset repeats one figure.",
      "ThinkingDots is decorative unless a label is provided by its React wrapper.",
      "No visual configuration studio is required. Choose a preset or define the sequence in code.",
    ],
    agentPrompt: `Read ${guideUrl("loaders")} and show ThinkingDots while the assistant prepares an answer.`,
    pages: basicPages(
      "Loaders",
      loadersDescription,
      "The browser module exports createThinkingDots and its timeline. The React package adds ThinkingDots.",
    ),
  },
  {
    slug: "shadows",
    name: "Shadows",
    description: shadowsDescription,
    packageName: "@reuse-sh/shadows",
    features: [
      ["Six levels", "From a small control to a floating surface."],
      ["Two soft layers", "With an optional hairline ring."],
      [
        "Variables",
        "Color and strength follow namespaced CSS custom properties.",
      ],
      ["Cards", "Code cards and action cards use the same scale."],
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
    ],
    notes: [
      "Import the stylesheet you need. No runtime JavaScript or Tailwind is required.",
      "Use the ring variant instead of stacking a separate border over the shadow.",
      'A data-reuse-theme="dark" ancestor opts into stronger shadows and a light ring.',
    ],
    agentPrompt: `Read ${guideUrl("shadows")} and move our cards to the shadow scale. Keep our radii.`,
    pages: basicPages(
      "Shadows",
      shadowsDescription,
      "Shadows is a stylesheet. These are its classes.",
    ),
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
        "A tilt of a few degrees toward the direction of travel, which settles once the pointer stops.",
      ],
      [
        "Rich content",
        "Text by default. A template or a function can put a shortcut, a photo or a person's card inside.",
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
        "Binds every [data-reuse-tooltip] inside root to one shared popup. Returns refresh, dismiss, update and destroy.",
      ],
      [
        "side, sideOffset",
        "Where the popup sits from the pointer. Bottom right and 10 px by default.",
      ],
      [
        "tilt",
        "Leans the popup by up to this many degrees while the pointer moves. 5 by default, 0 turns it off.",
      ],
      [
        "content(trigger)",
        "Returns text or a node for a trigger. A trigger with data-reuse-tooltip-template uses that template instead.",
      ],
      [
        "delay, closeDelay",
        "The wait before the first hint shows and before the last one hides. Moving between triggers swaps at once.",
      ],
      ["track", "Follow the pointer or stay on the trigger, per axis."],
    ],
    notes: [
      "Native triggers use data-reuse-tooltip. The React wrapper accepts content and side.",
      "A tooltip contains a short, non-interactive hint. Use a different surface for controls or required instructions.",
      "Focus receives an anchored hint. Touch is not treated as hover.",
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
            lead: "A card with a photo and a line of context for links in running text, so a reader can decide before leaving the page.",
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
        "Hover and focus",
        "Pointer and keyboard focus share the same geometry.",
      ],
      [
        "Selection kept apart",
        "The selected row stays distinct from a passing pointer.",
      ],
      ["Layout changes", "Resize and content changes update the position."],
      ["Short and long moves", "Short moves slide, distant moves fade."],
    ],
    api: [
      [
        "createMovingHighlight(root, options?)",
        "Adds one background that follows the rows inside root. Options: rowSelector, selectedSelector, mode, className.",
      ],
      ["data-reuse-row", "Marks a row the highlight can move to."],
      ["data-current", "Marks the selected row, where the highlight rests."],
      ["MovingHighlight", "The React wrapper around the same controller."],
    ],
    notes: [
      "Mark rows with data-reuse-row and the persistent selection with data-current.",
      "The controller measures the real element. It does not require a menu library.",
      "Destroy removes the background and restores styles owned by the controller.",
    ],
    agentPrompt: `Read ${guideUrl("moving-highlight")} and add a moving highlight to the sidebar navigation.`,
    pages: basicPages(
      "Moving highlight",
      highlightDescription,
      "The browser module exports createMovingHighlight. The React package adds MovingHighlight.",
    ),
  },
  {
    slug: "hold-to-confirm",
    name: "Hold to confirm",
    description: holdDescription,
    packageName: "@reuse-sh/interactions",
    features: [
      ["Any input", "Hold with a pointer, Space, or Enter."],
      ["Easy to cancel", "Release or Escape cancels before confirmation."],
      ["Once per hold", "Confirmation fires once for each completed hold."],
      [
        "Assistive activation",
        "A click from assistive technology still confirms.",
      ],
    ],
    api: [
      [
        "createHoldToConfirm(button, { onConfirm, holdMs? })",
        "Turns a button into a hold. onConfirm runs once the hold completes.",
      ],
      ["HoldToConfirmButton", "The React button around the same controller."],
    ],
    notes: [
      "The controller owns the hold gesture. Your application owns the request, loading, success, and failure.",
      "A click from assistive technology confirms without requiring an unavailable physical hold.",
      "Leaving the button, pointer cancellation, blur, Escape, and destroy cancel pending work.",
    ],
    agentPrompt: `Read ${guideUrl("hold-to-confirm")} and make the Delete project button a hold to confirm.`,
    pages: basicPages(
      "Hold to confirm",
      holdDescription,
      "The browser module exports createHoldToConfirm. The React package adds HoldToConfirmButton.",
    ),
  },
  {
    slug: "avatars",
    name: "Avatars",
    description: avatarsDescription,
    packageName: "@reuse-sh/avatars",
    features: [
      [
        "Real cutouts",
        "Transparent cutouts instead of painted background rings.",
      ],
      ["Badges", "Dot, count, and icon badges with their own geometry."],
      ["Groups", "Groups preserve the shape where images overlap."],
      [
        "Fallbacks",
        "Unicode initials and image failure have useful fallbacks.",
      ],
    ],
    api: [
      [
        "enhanceAvatar(root)",
        "Adds cutouts and fallbacks to avatar markup already on the page.",
      ],
      [
        "createAvatar(root, { name, src?, size?, badge? })",
        "Builds an avatar with initials, an image and an optional badge.",
      ],
      [
        "createAvatarGroup(root, options?)",
        "Overlaps avatars and cuts each one where the next overlaps it. Options: overlap, clearance.",
      ],
      ["getInitials(name)", "Grapheme-aware initials for a name."],
      ["Avatar, AvatarGroup", "The React components around the same code."],
    ],
    notes: [
      "The badge label is part of the accessible name. The badge drawing itself is decorative.",
      "Multi-digit counts use a capsule cutout measured from the actual badge.",
      "Initials use grapheme-aware segmentation. Generated marble images are not part of this package.",
    ],
    agentPrompt: `Read ${guideUrl("avatars")} and use it for the avatars in the member list, with an online dot.`,
    pages: basicPages(
      "Avatars",
      avatarsDescription,
      "The browser module exports enhanceAvatar, createAvatar and createAvatarGroup. The React package adds Avatar and AvatarGroup.",
    ),
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
