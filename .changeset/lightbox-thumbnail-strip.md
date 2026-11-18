---
"@reuse-sh/lightbox": minor
---

The bottom thumbnail strip runs from edge to edge, and each thumbnail keeps its photo's proportions from the item's `width` and `height` (square without them, at least 24px wide). The active thumbnail is marked by a ring that slides to the next one instead of a border, the others sit at 45% opacity and brighten on hover. A theme that styled `button[aria-current="true"]` can restyle the marker through `.re-lightbox-thumbnail-ring`.
