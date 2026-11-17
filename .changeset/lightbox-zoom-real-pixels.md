---
"@reuse-sh/lightbox": minor
---

Zoom now follows the photo's own pixels. A double tap, a click and the zoom button go to 1:1, or to `tapZoom` when that is larger, and a photo the screen already shows at full resolution has no zoom button, zoom cursor or double tap, so it is never stretched. Breaking: `maxZoom` is now a multiple of 1:1 and defaults to 1; for an SVG it stays a multiple of the fitted size with a default of 4. `zoomTo()` stops at the current photo's maximum.

A pan while zoomed stretches past the edges and glides on release. A pinch goes a little past its limits and springs back, closes below 0.75, and carries on as a pan when one finger lifts. Ctrl or Cmd with the wheel and a trackpad pinch zoom around the pointer, Safari's gesture events do the same, and a plain wheel does nothing until you zoom in. While zoomed the strip stops paging; a second swipe toward the edge the photo rests against goes to the next photo. The arrow keys pan a zoomed photo by 10% of the screen, and zooming out by tap, click or the button returns to the center. A resize or a change of photo drops the zoom at once, and no pointer move, wheel or gesture event reads layout.
