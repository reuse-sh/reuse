# Selected collection

The public collection is limited to Lightbox, Carousel, Annotations, Loaders with ThinkingDots, Shadows with card patterns and a fade edge for horizontal scrollers, Floating tooltip, Moving highlight, Hold to confirm, and Avatars. The original 54-entry candidate list is superseded.

## Architecture

Every selected library lists its principles in packages/catalog, and those rules matter more than any one implementation of them. Keep one monorepository with independent packages. Native entries own behavior and cleanup, React entries adapt lifecycle and composition, and the site imports the actual packages. Carousel is shared by Lightbox. Annotation protocol/rendering is shared by browser and server. The small core package contains internal clipboard and HTML escaping utilities.

## Delivery and use

Choose a real consumer, keep platform behavior, implement the repeated mechanics once, document the interface, and check the integration. Supported behavior comes from tests and real examples. Avoid additional general-purpose UI components and configuration panels.

## Known boundaries

Repeat needs enough content to cover the viewport and largest slide without cloning original interactive DOM. Images are the lightbox media baseline. Rich media, product-specific widget presentation, and annotation scene cloning require separate adapters. The eased gradient ships only as the Shadows fade edge; other smooth gradient uses remain candidates until a concrete usage is selected.

Existing products are source and integration references. These new packages are not yet installed in those products. The current task creates the shared implementations and proves standalone/React use; it does not perform production migrations.
