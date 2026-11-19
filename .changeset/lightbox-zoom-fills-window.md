---
"@reuse-sh/lightbox": minor
---

A zoomed photo now pans to the window's edges, also under the aside panel, the thumbnail strip and the room a page keeps for its own footer with the new `--re-lightbox-bottom-room` property, and only the close and zoom buttons come back while it is zoomed, with every footer child hidden. Dragging a zoomed photo shows the grabbing cursor instead of the default arrow. A zoom by the button, a key, a click or a double tap eases in over 350ms on `--re-lightbox-ease` instead of jumping most of the way in its first frames; a pinch and a wheel still follow the input at once.
