---
"@reuse-sh/lightbox": minor
---

The bottom thumbnail strip runs from edge to edge, and each thumbnail keeps its photo's proportions from the item's `width` and `height` (square without them, at least 24px wide). A ring stands still in the middle of the strip and marks the current photo instead of a border, and the others sit at 45% opacity and brighten on hover. Dragging, swiping or scrolling the strip, or the side column, opens each photo in place as its thumbnail passes under the ring, with previews until the strip stops and the full files after. A theme that styled `button[aria-current="true"]` can restyle the marker through `.re-lightbox-thumbnail-ring`.
