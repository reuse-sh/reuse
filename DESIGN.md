# Reuse design

## Purpose

Show reusable, tested web building blocks through real interactions. The home page is a concise presentation with a working carousel and image gallery, a small library overview, and three integration steps. It contains no installation code or author byline.

## Direction

Use local Geist Sans and Geist Mono, a neutral #fcfcfc page, white surfaces, charcoal text and neutral gray secondary text. Hugeicons provide the non-directional icons. Four local Lucide SVGs provide every arrow and chevron without a Lucide runtime dependency. The site has no green accent. Meaningful media and status colors belong only to their examples.

The global header links to a native library dropdown, How to use, and agent documentation. Each library has its own landing page at /{library} and scoped documentation. Desktop library pages use a fixed 180px sidebar 40px from the viewport edge, with 14px links. The active link uses dark medium text and a small dot, without a filled row. Content is about 720px wide. Below 1000px the sidebar becomes a disclosure. The header follows the viewport gutter, not the prose width.

## Surfaces

Use the shadows library for code cards, action cards, steps and distinct demonstration frames. Most features are icon and text in open space. Do not wrap every sentence in a card. Cards use white on the neutral page, a visible fine edge, considered radius and generous padding. Integration steps use 24px corners, about 28–32px padding, 14–15px descriptions and actual component/content previews. Reuse the same step cards on the home and How to use pages.

## Elements and fixtures

Header: identity, library switcher and reading paths. Home: purpose, real media demo, selected library links, three steps. Library overview: name, concrete description, working demo and feature explanations. Documentation: behavior, usage, API, integration checks and copyable agent guide. No large unimplemented catalogue.

Verify media with different crops and widths; rapid next/previous and close/open; empty/one-item galleries; failed image decode; long annotation text; all six annotation kinds; multi-digit badges; loading/offscreen/reduced-motion states. Check 320px, 390px, 768px and ordinary laptop widths, keyboard navigation and 200% text scaling where supported.

## Motion and ownership

Native scroll snap owns carousel and lightbox paging. Zoom and gestures never run through a React render on every pointer event. CSS/WAAPI/rAF explain actual state changes; no page entrance choreography. Animations stop offscreen or when the document is hidden and use static alternatives under reduced motion. Each controller restores its owned styles and listeners on destroy. Carousel bullets keep their circular shape. One filled 4px mark moves over the static marks in 300ms with cubic-bezier(0.32, 0.72, 0, 1). Each button has a separate 24px hit target.

## Content

Public copy is English. Keep claims limited to implemented, verified behavior. Brand is Reuse, the domain is reuse.sh, and packages use the @reuse-sh scope. Do not list design references in product copy. Required software and image licensing stays in distribution notices.
