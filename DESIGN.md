# Reuse design

## Purpose

Show reusable, tested web building blocks through real interactions, and give coding agents what they need to install them. The home page presents the parts at work. Each library has its own pages at /{library}. Agent guides live at /for-agents.

## Semantic design system

The site uses Tailwind 4 with semantic @theme mappings in apps/site/app/globals.css and reusable React primitives in components/ui. The neutral palette, Geist/Fraunces typography and double-ring surfaces remain the brand. Small spacing/type adjustments use standard Tailwind scales.

Colors use background/foreground, card, popover, primary, secondary, muted, accent, border, ring and destructive roles. Body prose uses muted-foreground; captions use subtle-foreground on background and card, and muted-foreground on secondary and muted surfaces, where subtle-foreground falls below 4.5:1. Message and overlay roles belong to their actual demonstrations. Do not add raw palette or arbitrary color classes to site components.

Typography uses text-display, text-page-title, text-section, text-subsection, text-lead, text-body, text-ui, text-label, text-caption and text-code. Radii and shadows have control/panel/frame/code and control/raised/panel/pop roles. Layout uses content/docs containers and gutter/section tokens. Do not recreate c-* aliases or add a token for each old magic number. Body copy stays 15px/24px. Feature copy uses 14px with a 1.5 line-height. Documentation section headings use the 17px/24px subsection role, not the marketing section role. Display and page headings use their own tracking presets; do not apply one tracking value to every font and size.

Button variants, Card/CardContent, Heading/Text, Kbd, FeatureGrid/FeatureCopy, Toolbar/MenuSurface and CodeSurface own repeated presentation. Callers compose them and use utility classes for layout. cn is compiled from the Tailwind theme so named font sizes, colors and radii merge correctly. Package CSS lives in the components layer on the site; Tailwind utilities can adapt presentation without !important.

Raw geometry is allowed for actual SVG paths, annotation coordinates, canvas data, measured highlights, gestures and syntax-highlighter output. Those are content or runtime mechanics, not alternative design tokens. Compound effects may use scoped CSS with semantic theme values.

## Header and Libraries menu

The header is sticky, 56px, with a translucent page-colored background and a 1px line once the page scrolls. Left: the logo, a 20px rounded tile with "Re:" cut out of it in Geist 600, then a slash, and the library switcher at 14px. On a library page the switcher shows that library's icon and name, elsewhere it reads "Libraries". Right: Agent guides, Tools and a GitHub icon with a tooltip. A moving highlight follows the pointer across both groups. On narrow screens, the library control keeps a visible 16px icon and a 32px target. Its library name stays accessible when the text label is visually hidden. The logo carries no wordmark. Its link is named "Reuse" for assistive technology, and its tooltip reads "Reuse · Interface parts for any stack". The favicon is the same tile with light letters, so it reads on dark tab strips.

The switcher opens a three-column menu grouped as Media, Interface, and Motion and style. Each row has an icon, the name and one short line. The current library's row holds the highlight at rest. Pointer users see a live preview card at the cursor, carried by Cursor preview: it drops in at the pointer, trails it on the tooltip's spring, leans up to 5 degrees and crossfades from one card to the next. Each card is a Demo stage scene. Thirteen run the real package: a scripted cursor presses the actual hold button, drags the real annotation editor and resizes the real gallery. The lightbox and Cursor preview cards are miniatures, because the real viewer opens a modal dialog over the whole page and the real preview positions against the viewport, not the scaled scene. A scripted click never writes the clipboard, so the copy scene shows the copied state without copying. A scene loops back to its first frame, starts over each time the card shows, and holds a still frame under reduced motion. The scenes load the first time the menu opens on a device with a mouse or trackpad, so pages and touch-only devices do not pay for them. Until they arrive the card shows an empty frame of the same size. Keyboard and touch users get the same menu without it. ArrowDown opens the menu, arrows move between rows and columns, Home and End jump, Escape closes and returns focus, and an outside press or navigation closes it. At 600px and below the menu is one scrolling column inside the viewport.

The footer starts with the logo tile, named "Reuse" by visually hidden text, then Agent guides, Tools and GitHub, at 14px like the header. GitHub links open in a new tab.

## Documentation and usage

Preserve the quiet existing sidebar and nested groups. Framework selection is an unboxed row with an icon and spacing; its options use Moving highlight. React is the default. The selected platform travels in URLs and changes instructions/code while the shared showcase keeps its state.

Overview contains a description, contextual Copy prompt for your agent and Get started actions, the live showcase, basic interaction hints and principles/features. Every documentation page keeps its contextual agent handoff next to its introduction. Copy prompt buttons use the quiet white surface variant consistently, including home and Agent guides. Documentation examples stay visually primary. General library-selection prompts do not force a stack; contextual documentation prompts receive their selected platform explicitly. Reference links in copied prompts retain the current page and selected platform. Do not remove those entry points while simplifying page content. It contains no installation/code sections or bottom prompt panel. Getting started starts with Install and proceeds through concise usage. Guides explain their specific subject and do not repeat an installation section or promise unimplemented media types. Named examples show the result, installation and authored explanations/code in order. Preview/Code and source-file tabs are absent.

Published examples teach the library interface, not the showcase implementation. HTML is a fragment, not a whole page. Include only styling and lifecycle that the feature needs. Shadows starts with its stylesheet import and a literal re-shadow class. Do not publish fixture dumps, a private theme/reset, SVG icon inventories or an import Example/return Example tutorial. The catalog owns authored usage shared by website, README and agent guide.

Features on the home page and library overviews use FeatureGrid and FeatureCopy. Their bold title uses foreground and their description uses muted-foreground. Agent guide cards reuse FeatureCopy. Do not let a title inherit the description color. Sidebar rows use compact UI leading without extra vertical link padding. Inactive rows stay quiet but meet 4.5:1; hover and the current row use the sidebar-active color, and the current row is medium weight. Menu icons center on the title line. Pager corners use the smaller surface radius and compact vertical padding.

HoldButton owns the shared presentation and confirmed/done colors for every hold control, including the home demo. The controller reset callback owns both the confirmed label and fill; do not add a separate label timer. Hold controls keep 40px hit targets with 14px labels. Shared buttons have no border by default; only an outline variant owns a border. A transparent border still changes the hold fill geometry.

Every lightbox on the site opens with what the lightbox package ships, theme.css and the built-in icons, plus only the options its published code shows. No site stylesheet or icon set sits on top. Controls previews take the re-lightbox-style class from lightboxPreviewModule and add only their differences on top. LightboxLaunch adds no class of its own, because the themes page uses it to show the package themes as they ship.

Code blocks use an outer frame containing a quiet language label and copy action, plus a nested white code surface. Pointer devices reveal copying on hover or keyboard focus. Touch and hybrid devices keep copying visible, and pending/success/error feedback remains visible. Code blocks and following paragraphs use shared content-flow spacing. Code remains readable/selectable without JS, copying is an enhancement. The actual showcase composition, photo crops, SVG icons, control order and motion stay intact. Carousel overview keeps compact moving dots on the left and quiet SVG arrows on the right; product arrows stay beside the heading.

## Motion

Moving highlights follow Poise: they appear with a scale from 0.97 to 1, slide in 150ms and fade in 100ms. Tooltips are dark pills placed bottom-right of the pointer, 10px away, leaning up to 5 degrees with pointer speed. The logo tooltip is the exception: it follows the pointer only sideways and stays 10px below the logo, so it never covers the library switcher next to it. They grow in from the pointer corner and roll from one hint to the next in the direction of travel. Native scroll snap owns carousel and lightbox paging, with a spring glide after release. CSS, WAAPI and rAF explain actual state changes. There is no page entrance choreography. Shared button transitions include scale and transform for press and release; color-only transitions must not override the copy controller's press feedback. Animations stop offscreen or when the document is hidden and use static alternatives under reduced motion. Each controller restores its owned styles and listeners on destroy.

## Media

Demonstration media are generated marble textures. scripts/generate-marble.mjs writes them as apps/site/public/images/marble-*.svg, and scripts/rasterize-marble.mjs renders each one to WebP at 1.5 times its size, named by its pixel size. Pages and examples show the WebP files, because the blurred SVGs repaint on every frame a photo moves. They carry no third-party image license.

## Verification

Verify media with different crops and widths, rapid next and previous, empty and one-item galleries, failed image decode, long annotation text and multi-digit badges. Check 320px, 390px, 768px and laptop widths, keyboard navigation, reduced motion and 200% text where supported.

## Content

Public copy is English and plain. No eyebrows above headings, no package sizes, and no filler about price or license. Claims stay limited to implemented, verified behavior. The brand is Reuse, the domain is reuse.sh, and packages use the @reuse-sh scope. Required software and font licensing stays in distribution notices.
