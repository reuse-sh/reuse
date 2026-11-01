export interface Library {
  slug: string;
  name: string;
  description: string;
  packageName: string;
  features: string[];
  api: string[];
  notes: string[];
}
export const libraries: Library[] = [
  {
    slug: "lightbox",
    name: "Lightbox",
    description:
      "A native image viewer, from thumbnail to every little detail.",
    packageName: "@reuse-sh/lightbox",
    features: [
      "Scroll and swipe with the browser.",
      "Open from a cropped thumbnail and return to its place.",
      "Pinch, pan, double-tap, and zoom around the pointer.",
      "Keep focus, scroll position, and loading under control.",
    ],
    api: [
      "createLightbox(options?)",
      "open(items, index?)",
      "close(), next(), prev(), goTo(index)",
      "zoomTo(scale, focus?), toggleZoom(focus?)",
      "getState(), subscribe(listener), destroy()",
    ],
    notes: [
      'Image click zooms by default. Use imageClick: "close" and doubleTapZoom: false for a publishing gallery.',
      "Pages are driven by the shared native carousel. Only the current and neighboring images stay loaded, and pages still on screen while the strip travels are kept. Adjacent navigation scrolls smoothly; distant thumbnail jumps fade through the backdrop so unloaded pages never appear in between.",
      "Captions and optional thumbnails are supported. Video, iframe, and product-specific annotation cloning are not media renderers in this release.",
    ],
  },
  {
    slug: "carousel",
    name: "Carousel",
    description:
      "Native scrolling. Precise controls. A strip that belongs to your page.",
    packageName: "@reuse-sh/carousel",
    features: [
      "Native touch and trackpad scrolling with CSS snap.",
      "Mouse dragging with flick, groups, and variable slide widths.",
      "Original elements stay interactive during repeat.",
      "Resize, RTL, autoplay, and dynamic content share one controller.",
    ],
    api: [
      "createCarousel(viewport, options?)",
      "prev(), next(), goTo(index, behavior?)",
      "getState(), subscribe(listener), refresh()",
      "play(), pause(), hold(reason, isHeld)",
      "setEnabled(enabled), destroy()",
      "syncCarousels(...controllers)",
    ],
    notes: [
      "Repeat needs enough content to cover the viewport and the largest slide. When there is not enough, isLooping is false and ordinary scrolling remains available.",
      "The coverage condition is cycleWidth >= viewportWidth + largestSlideWidth. It is reevaluated after resize or content changes.",
      "Autoplay pauses for hover, focus, dragging, hidden pages, offscreen content, and reduced motion.",
    ],
  },
  {
    slug: "annotations",
    name: "Annotations",
    description: "Point to what matters, with a format your tools can share.",
    packageName: "@reuse-sh/annotations",
    features: [
      "Area, spotlight, arrow, line, pointer, and marker.",
      "Percentage coordinates that follow the image.",
      "One validated format for storage, rendering, and editing.",
      "A controlled editor with keyboard, undo, and redo.",
    ],
    api: [
      "parseAnnotations(value)",
      "serializeAnnotations(value), annotationsToHtml(value)",
      "annotationsFromHtml(element)",
      "renderAnnotations(value, options)",
      "createAnnotatedImage(root, options)",
      "createAnnotationEditor(root, options)",
    ],
    notes: [
      "The versioned JSON document is { version: 1, annotations: [...] }. The existing six-kind array is also accepted.",
      "Marker text permits strong, em, and code only. Labels and attributes are escaped at the boundary.",
      "Pointer labels move to a numbered list when the available width is narrow.",
    ],
  },
  {
    slug: "loaders",
    name: "Loaders",
    description: "Small signs of progress, with movement worth keeping.",
    packageName: "@reuse-sh/loaders",
    features: [
      "Sixteen geometric figures from one native timeline.",
      "Dots move between figures rather than disappearing.",
      "The same engine for a single preset or a sequence.",
      "Animation stops when hidden and respects reduced motion.",
    ],
    api: [
      "createThinkingDots(canvas, options?)",
      "play(), pause(), setConfig(config), destroy()",
      "figureConfig(name), figureNames",
      "createTimeline(config, seed), sampleDot(timeline, dot, time)",
    ],
    notes: [
      "The default sequence morphs through the full collection. A figure preset repeats one figure.",
      "ThinkingDots is decorative unless a label is provided by its React wrapper.",
      "No visual configuration studio is required. Choose a preset or define the sequence in code.",
    ],
  },
  {
    slug: "shadows",
    name: "Shadows",
    description: "A little depth, with a clear edge and a soft falloff.",
    packageName: "@reuse-sh/shadows",
    features: [
      "Six levels from a small control to a floating surface.",
      "Two soft layers, with an optional hairline ring.",
      "Color and strength follow namespaced CSS variables.",
      "Code cards and action cards use the same scale.",
    ],
    api: [
      "reuse-shadow-xs … reuse-shadow-2xl",
      "reuse-shadow-ring-xs … reuse-shadow-ring-2xl",
      "reuse-card, reuse-card-frame",
      "reuse-card-code, reuse-card-action",
    ],
    notes: [
      "Import the stylesheet you need. No runtime JavaScript or Tailwind is required.",
      "Use the ring variant instead of stacking a separate border over the shadow.",
      'A data-reuse-theme="dark" ancestor opts into stronger shadows and a light ring.',
    ],
  },
  {
    slug: "floating-tooltip",
    name: "Floating tooltip",
    description: "One shared hint, following the pointer with a steady hand.",
    packageName: "@reuse-sh/interactions",
    features: [
      "Pointer following with keyboard anchoring.",
      "One popup shared across nearby triggers.",
      "A spring continues from its current position.",
      "Viewport clamping and reduced-motion behavior are built in.",
    ],
    api: [
      "createFloatingTooltip(root, options?)",
      'data-reuse-tooltip="Description"',
      "FloatingTooltip, FloatingTooltipGroup",
    ],
    notes: [
      "Native triggers use data-reuse-tooltip. The React wrapper accepts content and side.",
      "A tooltip contains a short, non-interactive hint. Use a different surface for controls or required instructions.",
      "Focus receives an anchored hint. Touch is not treated as hover.",
    ],
  },
  {
    slug: "moving-highlight",
    name: "Moving highlight",
    description: "A single surface that follows the item in focus.",
    packageName: "@reuse-sh/interactions",
    features: [
      "Hover and keyboard focus share the same geometry.",
      "Selection stays distinct from a passing pointer.",
      "Resize and content changes update the position.",
      "Short moves slide, distant moves fade.",
    ],
    api: [
      "createMovingHighlight(root, options?)",
      "data-reuse-row",
      "data-current",
      "MovingHighlight",
    ],
    notes: [
      "Mark rows with data-reuse-row and the persistent selection with data-current.",
      "The controller measures the real element. It does not require a menu library.",
      "Destroy removes the background and restores styles owned by the controller.",
    ],
  },
  {
    slug: "hold-to-confirm",
    name: "Hold to confirm",
    description: "An intentional press, with time to change your mind.",
    packageName: "@reuse-sh/interactions",
    features: [
      "Hold with a pointer, Space, or Enter.",
      "Release or Escape cancels before confirmation.",
      "Confirmation fires once for each completed hold.",
      "Assistive activation remains reachable.",
    ],
    api: [
      "createHoldToConfirm(button, { onConfirm, holdMs? })",
      "HoldToConfirmButton",
    ],
    notes: [
      "The controller owns the hold gesture. Your application owns the request, loading, success, and failure.",
      "A click from assistive technology confirms without requiring an unavailable physical hold.",
      "Leaving the button, pointer cancellation, blur, Escape, and destroy cancel pending work.",
    ],
  },
  {
    slug: "avatars",
    name: "Avatars",
    description: "Images, initials, and the small details around them.",
    packageName: "@reuse-sh/avatars",
    features: [
      "Transparent cutouts instead of painted background rings.",
      "Dot, count, and icon badges with their own geometry.",
      "Groups preserve the shape where images overlap.",
      "Unicode initials and image failure have useful fallbacks.",
    ],
    api: [
      "enhanceAvatar(root, options?)",
      "createAvatarGroup(root, options?)",
      "getInitials(name)",
      "Avatar, AvatarGroup",
    ],
    notes: [
      "The badge label is part of the accessible name. The badge drawing itself is decorative.",
      "Multi-digit counts use a capsule cutout measured from the actual badge.",
      "Initials use grapheme-aware segmentation. Generated marble images are not part of this package.",
    ],
  },
];
export const docSections = [
  { slug: "getting-started", title: "Getting started" },
  { slug: "examples", title: "Examples" },
  { slug: "api", title: "API" },
  { slug: "behavior", title: "Behavior" },
];
export function findLibrary(slug: string) {
  return libraries.find((library) => library.slug === slug);
}
