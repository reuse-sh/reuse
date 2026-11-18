---
"@reuse-sh/lightbox": patch
---

Close and dismiss fixes. A close during a swipe or a pinch ends the gesture, so the finger lifting afterwards no longer sends the photo back. A second finger during a dismiss swipe leaves the photo with the first finger instead of snapping it back. On a right-to-left page with a side caption the photo now flies to and from its tile, and below 720px the next arrow sits at the edge. A tile clipped away by its own scroll container fades instead of receiving the photo, while a tile visible beside the caption panel gets it back. A tile the page renders again in `beforeclose` stays hidden during the flight. The landing photo no longer counts as a slide of a carousel built on bare images. A busy main thread right after `open()` no longer cuts the flight short, and an easing list in `--re-lightbox-ease` falls back to the default curve instead of skipping the flight.
