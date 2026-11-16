# Selected collection

The public collection is limited to thirteen libraries: Lightbox, Carousel, Annotations, Justified gallery, Masonry, Loaders with ThinkingDots, Shadows with card patterns, Easing gradients with a fade edge for horizontal scrollers, Floating tooltip, Moving highlight, Hold to confirm, Copy button, and Avatars. The /tools page lists the outside interface tools we trust, from typed data in packages/catalog. The original 54-entry candidate list is superseded.

## Architecture

Every selected library lists its principles in packages/catalog, and those rules matter more than any one implementation of them. Keep one monorepository with independent packages. Native entries own behavior and cleanup, React entries adapt lifecycle and composition, and the site imports the actual packages. Carousel is shared by Lightbox. Annotation protocol/rendering is shared by browser and server. The small core package contains internal clipboard and HTML escaping utilities.

## Delivery and use

Choose a real consumer, keep platform behavior, implement the repeated mechanics once, document the interface, and check the integration. Supported behavior comes from tests and real examples. Avoid additional general-purpose UI components and configuration panels.

## Known boundaries

Repeat needs enough content to cover the viewport and largest slide without cloning original interactive DOM. Images are the lightbox core. Video, audio, iframe and HTML slides are separate lightbox modules, not part of the core. Live Photos and HDR are not supported. Product-specific widget presentation and annotation scene cloning require separate adapters. Easing gradients covers linear and radial gradients between two colors and the fade edge. Multi-color ramps remain candidates until a concrete usage is selected. Justified gallery needs every picture's proportions before its image loads, from width and height attributes or --re-ratio, or the rows shift when it loads. Masonry's fallback places items the way css-grid-3 §4.4 does and nothing more; native grid lanes ship only in Safari 26.4 and later.

Existing products are source and integration references. These new packages are not yet installed in those products. The current task creates the shared implementations and proves standalone/React use; it does not perform production migrations.
