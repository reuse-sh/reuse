# Verification

Verified on 2026-11-01 in /Users/nikita/work/libs/reuse with Node.js 22.23.2 and pnpm 11.15.1.

## Automated checks

pnpm check passed after the rename and media fixes. Biome checked 104 supported files without warnings. Type checking passed all 19 tasks. Vitest passed 129 behavioral tests: core 4, carousel 19, lightbox 28, annotations 25, loaders 21, interactions 15, avatars 17. The production build passed all 10 package tasks and generated 63 static pages and route outputs.

A final site type check, production build and lint passed after the autoplay control and responsive type refinements. The final lightbox CSS build passed after ensuring readable controls on image backgrounds. Temporary diagnostic source was removed and lint passed again.

The HTTP sweep checked 68 pages/assets with HTTP 200, nine Markdown guide content types and three unknown/removed routes with HTTP 404. It asserted the @reuse scope in every library guide, reuse.sh in the sitemap and the absence of the old brand/scope in served content. The old project directory no longer exists. Native imports, styles, font and the standalone HTML example were included.

node scripts/measure-native.mjs imported every native entry without React or a browser at module load and rejected external native runtime imports. Native Carousel totals 5,368 bytes gzip. Lightbox including Carousel totals 14,100 bytes gzip. The measurement sums individually gzipped unminified ESM modules and excludes CSS, React adapters, images and fonts. See native-sizes.json.

## Reproduced defects and fixes

Before the mouse-drag fix, dragging a photo button from 750, 520 to 450, 520 left the old carousel at scrollLeft 2494.5 and slide 1. The corrected carousel moved to slide 2 after a real drag over the image. No accidental lightbox opened. Rapid Next, Next, Previous ended at the expected slide 3, and slide 6 followed by Next returned to slide 1.

Regression tests first failed on image/button dragging, stale scrollend resetting the requested target, child DOM changes interrupting scroll, interrupted crop geometry, zoom during paging and wheel overriding an in-flight zoom. The fixes keep native scroll snap, retain pending targets, observe slide identity/order, and commit current animation geometry before continuing. All corresponding regressions pass.

The running lightbox moved to image 2 after mouse paging at full viewport width. Zoom then drag produced matrix(2.5, 0, 0, 2.5, 180, 100). Closing during opening removed the dialog without an animation exception. A far thumbnail jump originally showed a blank viewer while the viewport traversed unloaded pages. After the fix, image 1 to 6 immediately reached scrollLeft 7280 at a 1456px page step and displayed the correct woods image. Adjacent navigation remains smooth.

The autoplay demo originally changed back to Pause and resumed after the person clicked Pause and moved focus away. Manual pause is now separate from temporary hover/focus holds. Browser verification confirmed Play remains after leaving the control and Pause returns after explicitly choosing Play.

Avatar badges previously anchored their bottom/right edges, so widening a count shifted its center inward. The corrected 64px avatars measured the same badge center at 54.625px, 54.625px for dot, 128-count and icon badges. Group masks now affect the face rather than clipping the whole avatar. Tests cover independent badge/group mask ownership, teardown and zero clearance.

## Rendered interface

The source references were inspected in the browser before the revision. The sidebar now measures 180px wide at x 40 on a 1440px viewport. The main content measures 720px wide at x 360. Sidebar links use 14px type and a dark active item with a small dot. Four local Lucide SVGs supply directional icons; their original licenses are kept beside the component.

Home and integration steps were checked at 320, 390, 768, 1024 and 1440px widths. Every library landing page was also checked at 320 and 1440px. None had horizontal document overflow. Integration steps share the same real preview cards and working guide-copy action on Home and How to use.

The browser checked library navigation, the mobile disclosure, guide-copy feedback, annotation creation and Undo, tooltip keyboard text, confirmation holding, moving selection and shadow size selection. Keyboard area creation changed selectable areas from 1 to 2; Undo restored 1. A 1.4-second hold reached Confirmed. Team selection moved the single highlight. xl selected re-shadow-ring-xl. The tooltip displayed Add layers after keyboard navigation.

Screenshots are JPEG files in the session visualization directory: reuse-home.jpg, reuse-lightbox.jpg and reuse-how-to-use.jpg.

## Console isolation

The in-app browser emitted an uncaught MutationObserver.observe invalid-Node error during navigation away from a document containing an iframe. The same exception reproduced on a separate plain HTML server with a blank iframe and no Reuse, React, Next.js or application MutationObserver. A fresh pass through the library pages without that iframe navigation produced no errors. The exception was isolated to the browser-verification environment and was not suppressed in product code. Temporary probe pages and listeners were removed, and their separate server was stopped.

## Review and limits

The review traced all renamed imports/exports and generated documentation, carousel pending targets/observer lifecycle, lightbox animation interruption/paging/zoom, avatar masks, component labels and control state. React adapters retain the same native implementations. Original product checkouts were not edited.

Safari, Firefox, physical touch/pinch devices, assistive technology, OS reduced-motion changes and back/forward cache remain unverified in this run. Unit tests cover the relevant reduced-motion and lifecycle branches, which do not replace those device checks. Clipboard feedback was observed; OS clipboard payload inspection remains unproven through the browser tool.

Packages are local and unpublished. No existing product was migrated, no GitHub remote was created, and no deployment or DNS change was made. MIT remains the license for original code. The project domain and branding are Reuse / reuse.sh.
