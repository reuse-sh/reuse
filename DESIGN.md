# Reuse design

## Purpose

Show reusable, tested web building blocks through real interactions, and give coding agents what they need to install them. The home page presents the parts at work. Each library has its own pages at /{library}. Agent guides live at /for-agents.

## Tokens

Tokens are fixed on :root in apps/site/app/globals.css. There are no runtime settings or data attributes that switch them.

- Color: --bg #fcfcfc off-white page, --surface #fff, --ink #111, --ink-2 #2e2e2e for leads, --prose #5b5b5b for body copy, --mute #858585 for secondary text. The site has no accent color. Media and status colors belong only to their examples.
- Hover: --hover is black at 3%. Every quiet hover and moving highlight uses it.
- Shape: --r 1.35 multiplies base radii, so a 16px card corner becomes about 22px. Code blocks use 12px times --r.
- Layout: --col 840px content column with a 16px gutter (80px from 1100px), --sec 120px between sections (88px at 760px and below).
- Depth: shadow tokens built from the @reuse-sh/shadows levels with its 0.5px ring in --ring-color (black at 8%): --shadow-ring alone, --shadow-control (xs) for buttons, pills and keys, --shadow-raised (sm, --shadow-ring plus --shadow-raised-soft) for cards, code blocks and small floating surfaces, --shadow-panel (md) for example app windows, --shadow-pop (lg) for menus, popovers and dialogs. 
- Motion: --ease cubic-bezier(0.23, 1, 0.32, 1).

## Type

Geist Sans for interface and body text at 15px/24px, Geist Mono for code, and Fraunces (next/font/google, opsz axis) as the display face at weight 300 with -0.02em tracking. Page titles (c-h1, 34px) and the home display line (c-display, 50px) use Fraunces. Section titles (c-h2, 21px/600) and subsection titles (c-h3, 17px/600) stay in Geist. Body copy is --prose, never lighter.

## Surfaces

Cards are a double ring: a 4px outer frame of white at 55% with --shadow-ring, around a white inner card with --shadow-raised (c-card > c-card-in). Most features are an icon and text in open space (c-feats, three columns, two at 760px, one at 600px). Do not wrap every sentence in a card. The hold-to-confirm button has no shadow: a red tint (#c2362b at 8%, 12% on hover with a 150ms transition) under a red hold fill. Once confirmed it keeps the fill and ignores presses until it resets. Toolbars (c-toolbar) and menu cards (c-menu-card) are white surfaces with --shadow-raised and a moving highlight, shared by the home cards and the library pages. Every live example on a library page sits in the same double ring card with 32px padding, apart from the page text. Previous and next links are one joined card split by a 1px line.

## Header and Libraries menu

The header is sticky, 56px, with a translucent page-colored background and a 1px line once the page scrolls. Left: the "Reuse" wordmark (14px, 600) with its square dashed pointer icon, which is also the favicon, a slash, and the library switcher at the same 14px. On a library page the switcher shows that library's icon and name, elsewhere it reads "Libraries". Right: Agent guides, Tools and a GitHub icon with a tooltip. A moving highlight follows the pointer across both groups.

The switcher opens a three-column menu grouped as Media, Interface, and Motion and style. Each row has an icon, the name and one short line. The current library's row holds the highlight at rest. Pointer users see a live preview card at the cursor. Keyboard and touch users get the same menu without it. ArrowDown opens the menu, arrows move between rows and columns, Home and End jump, Escape closes and returns focus, and an outside press or navigation closes it. At 600px and below the menu is one scrolling column inside the viewport.

The footer is the "Reuse" wordmark with its icon, then Agent guides, Tools and GitHub, at 14px like the header. GitHub links open in a new tab.

## Tabs, code and highlight

Documentation changes preserve the existing sidebar typography, spacing and nested page groups. The framework choice is an unboxed row with an icon, separated from the page links by spacing. Do not turn it into a raised button or add a separate navigation structure. Example controls stay quiet and omit a separate Open example action.

Example views use plain Preview and Code links. Only the active item has a bottom line; there is no full-width divider, pill or raised surface. The sidebar chooses React or HTML + JavaScript for the whole documentation page. React is the default and examples use Tailwind. Framework options use the package Moving highlight for pointer and keyboard focus. The selected framework travels in documentation URLs. Code view shows the actual runnable files with filename links and the package copy control. CSS-only packages keep their stylesheet mechanics independent of the chosen framework.

## Motion

Moving highlights follow Poise: they appear with a scale from 0.97 to 1, slide in 150ms and fade in 100ms. Tooltips are dark pills placed bottom-right of the pointer, 10px away, leaning up to 5 degrees with pointer speed. Native scroll snap owns carousel and lightbox paging, with a spring glide after release. CSS, WAAPI and rAF explain actual state changes. There is no page entrance choreography. Animations stop offscreen or when the document is hidden and use static alternatives under reduced motion. Each controller restores its owned styles and listeners on destroy.

## Media

Demonstration media are generated marble textures in apps/site/public/images/marble-*.svg, written by scripts/generate-marble.mjs. They carry no third-party image license.

## Verification

Verify media with different crops and widths, rapid next and previous, empty and one-item galleries, failed image decode, long annotation text and multi-digit badges. Check 320px, 390px, 768px and laptop widths, keyboard navigation, reduced motion and 200% text where supported.

## Content

Public copy is English and plain. No eyebrows above headings, no package sizes, and no filler about price or license. Claims stay limited to implemented, verified behavior. The brand is Reuse, the domain is reuse.sh, and packages use the @reuse-sh scope. Required software and font licensing stays in distribution notices.
